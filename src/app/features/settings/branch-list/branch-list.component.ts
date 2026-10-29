import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  StoreApiService,
  StoreRequest,
  StoreResponse,
  StoreStatus
} from '../../../core/services/store-api.service';

interface StoreFormModel {
  storeCode: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  status: StoreStatus;
}

@Component({
  selector: 'app-branch-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './branch-list.component.html',
  styleUrl: './branch-list.component.scss'
})
export class BranchListComponent implements OnInit {
  stores: StoreResponse[] = [];
  loading = false;
  saving = false;
  editingStoreId: number | null = null;
  togglingStoreId: number | null = null;
  deletingStoreId: number | null = null;
  showForm = false;
  searchText = '';
  errorMessage = '';
  successMessage = '';

  form: StoreFormModel = this.emptyForm();

  constructor(private readonly storeApi: StoreApiService) {}

  ngOnInit(): void {
    this.loadStores();
  }

  private emptyForm(): StoreFormModel {
    return {
      storeCode: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      district: '',
      status: 'Active'
    };
  }

  private getTenantId(): number {
    const storedId = Number(
      localStorage.getItem('tenantId') ||
      localStorage.getItem('tenant_id') ||
      0
    );

    if (Number.isSafeInteger(storedId) && storedId > 0) {
      return storedId;
    }

    try {
      const user = JSON.parse(localStorage.getItem('pharm_user') || '{}');
      const fallback = Number(user.tenantId || user.tenant?.id || 0);
      return Number.isSafeInteger(fallback) && fallback > 0 ? fallback : 0;
    } catch {
      return 0;
    }
  }

  get activeCount(): number {
    return this.stores.filter(
      store => store.status?.toLowerCase() === 'active'
    ).length;
  }

  get inactiveCount(): number {
    return this.stores.length - this.activeCount;
  }

  get filteredStores(): StoreResponse[] {
    const query = this.searchText.trim().toLowerCase();
    if (!query) return this.stores;

    return this.stores.filter(store =>
      [
        store.name,
        store.storeCode,
        store.phone,
        store.email,
        store.address,
        store.city,
        store.district,
        store.status
      ].some(value => String(value || '').toLowerCase().includes(query))
    );
  }

  loadStores(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.stores = [];
      this.errorMessage =
        'Tenant ID পাওয়া যায়নি। আবার login করে pharmacy select করো।';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.storeApi.getAll(tenantId).subscribe({
      next: stores => {
        this.stores = (Array.isArray(stores) ? stores : []).sort(
          (a, b) => a.name.localeCompare(b.name)
        );
        this.loading = false;
      },
      error: error => {
        this.stores = [];
        this.errorMessage = this.readError(
          error,
          'Store list লোড করা যায়নি। API ও login পরীক্ষা করো।'
        );
        this.loading = false;
      }
    });
  }

  openCreateForm(): void {
    this.editingStoreId = null;
    this.form = this.emptyForm();
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  editStore(store: StoreResponse): void {
    this.editingStoreId = store.id;
    this.form = {
      storeCode: store.storeCode || '',
      name: store.name || '',
      phone: store.phone || '',
      email: store.email || '',
      address: store.address || '',
      city: store.city || '',
      district: store.district || '',
      status: store.status?.toLowerCase() === 'inactive'
        ? 'Inactive'
        : 'Active'
    };
    this.showForm = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingStoreId = null;
    this.form = this.emptyForm();
    this.errorMessage = '';
  }

  saveStore(): void {
    if (this.saving) return;

    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করো।';
      return;
    }

    const storeCode = this.form.storeCode.trim().toUpperCase();
    const name = this.form.name.trim();

    if (!storeCode || !name) {
      this.errorMessage = 'Store Code এবং Store Name অবশ্যই দিতে হবে।';
      return;
    }

    const request: StoreRequest = {
      storeCode,
      name,
      phone: this.form.phone.trim() || null,
      email: this.form.email.trim() || null,
      address: this.form.address.trim() || null,
      city: this.form.city.trim() || null,
      district: this.form.district.trim() || null,
      status: this.form.status
    };

    const wasEditing = this.editingStoreId !== null;
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const operation = wasEditing
      ? this.storeApi.update(tenantId, this.editingStoreId!, request)
      : this.storeApi.create(tenantId, request);

    operation.subscribe({
      next: saved => {
        this.saving = false;
        this.showForm = false;
        this.editingStoreId = null;
        this.form = this.emptyForm();
        this.successMessage = wasEditing
          ? `“${saved.name}” Store update হয়েছে।`
          : `“${saved.name}” Store তৈরি হয়েছে।`;
        this.loadStores();
      },
      error: error => {
        this.saving = false;
        this.errorMessage = this.readError(
          error,
          'Store save করা যায়নি। তথ্য ও permissions পরীক্ষা করো।'
        );
      }
    });
  }

  toggleStatus(store: StoreResponse): void {
    if (this.togglingStoreId !== null || this.saving) return;

    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করো।';
      return;
    }

    const isActive = store.status?.toLowerCase() === 'active';
    const nextStatus: StoreStatus = isActive ? 'Inactive' : 'Active';

    if (
      isActive &&
      !window.confirm(
        `“${store.name}” Inactive করলে এই Store-এ নতুন POS Sale করা যাবে না। চালিয়ে যাবে?`
      )
    ) {
      return;
    }

    const request: StoreRequest = {
      storeCode: store.storeCode,
      name: store.name,
      phone: store.phone || null,
      email: store.email || null,
      address: store.address || null,
      city: store.city || null,
      district: store.district || null,
      status: nextStatus
    };

    this.togglingStoreId = store.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.storeApi.update(tenantId, store.id, request).subscribe({
      next: updated => {
        this.togglingStoreId = null;
        this.successMessage =
          `“${updated.name}” Store status ${nextStatus} করা হয়েছে।`;
        this.loadStores();
      },
      error: error => {
        this.togglingStoreId = null;
        this.errorMessage = this.readError(
          error,
          'Store status পরিবর্তন করা যায়নি।'
        );
      }
    });
  }

  archiveStore(store: StoreResponse): void {
    if (
      this.deletingStoreId !== null ||
      this.togglingStoreId !== null ||
      this.saving
    ) {
      return;
    }

    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করো।';
      return;
    }

    const confirmed = window.confirm(
      `“${store.name}” archive করবে? Store Inactive হবে, কিন্তু পুরোনো transaction history রাখা হবে।`
    );

    if (!confirmed) return;

    this.deletingStoreId = store.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.storeApi.delete(tenantId, store.id).subscribe({
      next: () => {
        this.deletingStoreId = null;

        if (this.editingStoreId === store.id) {
          this.cancelForm();
        }

        this.successMessage =
          `“${store.name}” archive করা হয়েছে। Store এখন Inactive।`;
        this.loadStores();
      },
      error: error => {
        this.deletingStoreId = null;
        this.errorMessage = this.readError(
          error,
          'Store archive করা যায়নি। Store usage ও permissions পরীক্ষা করো।'
        );
      }
    });
  }

  private readError(error: any, fallback: string): string {
    const message =
      error?.error?.message ||
      error?.error?.detail ||
      error?.error?.title ||
      (typeof error?.error === 'string' ? error.error : '');

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (error?.status === 401) {
      return 'Login session শেষ হয়েছে। আবার login করো।';
    }

    if (error?.status === 403) {
      return 'এই কাজের permission নেই। Tenant Owner বা Pharmacy Admin account ব্যবহার করো।';
    }

    if (error?.status === 0) {
      return 'Backend-এর সঙ্গে সংযোগ হচ্ছে না। Backend চালু আছে কি না পরীক্ষা করো।';
    }

    return fallback;
  }
}
