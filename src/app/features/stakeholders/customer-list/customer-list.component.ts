import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface Customer {
  id: number;
  customerCode: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  openingBalance: number;
  status: string;
  createdAt?: string;
}

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  searchTerm = '';
  statusFilter = 'All';
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  showForm = false;
  editingId: number | null = null;

  form = {
    name: '',
    phone: '',
    email: '',
    address: '',
    openingBalance: 0
  };

  private tenantId = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    this.tenantId = this.getTenantId();
    if (!this.tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করুন।';
      return;
    }
    this.loadCustomers();
  }

  private getTenantId(): string {
    const user = this.parseUser();
    return String(
      localStorage.getItem('tenantId') ||
      localStorage.getItem('tenant_id') ||
      user?.tenantId ||
      user?.tenant?.id ||
      user?.currentTenantId ||
      ''
    );
  }

  private parseUser(): any {
    try {
      return JSON.parse(localStorage.getItem('pharm_user') || '{}');
    } catch {
      return {};
    }
  }

  private url(path = ''): string {
    return `${environment.apiUrl}/tenants/${this.tenantId}/customers${path}`;
  }

  loadCustomers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<Customer[]>(this.url()).subscribe({
      next: response => {
        this.customers = Array.isArray(response) ? response : [];
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'Customer list load করা যায়নি।';
      }
    });
  }

  get filteredCustomers(): Customer[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.customers.filter(customer => {
      const matchesSearch = !search || [
        customer.customerCode,
        customer.name,
        customer.phone,
        customer.email,
        customer.address
      ].some(value => String(value || '').toLowerCase().includes(search));

      const status = customer.status?.toUpperCase();
      const matchesStatus = this.statusFilter === 'All' ||
        (this.statusFilter === 'Active' && status === 'ACTIVE') ||
        (this.statusFilter === 'Inactive' && status !== 'ACTIVE');

      return matchesSearch && matchesStatus;
    });
  }

  get totalCustomers(): number {
    return this.customers.length;
  }

  get activeCustomers(): number {
    return this.customers.filter(c => c.status?.toUpperCase() === 'ACTIVE').length;
  }

  get inactiveCustomers(): number {
    return this.totalCustomers - this.activeCustomers;
  }

  get totalDue(): number {
    return this.customers.reduce((sum, c) => sum + Number(c.openingBalance || 0), 0);
  }

  getInitial(name: string): string {
    return name?.charAt(0).toUpperCase() || '?';
  }

  getStatusClass(status: string): string {
    return status?.toUpperCase() === 'ACTIVE' ? 'status-active' : 'status-inactive';
  }

  openAddForm(): void {
    this.editingId = null;
    this.form = { name: '', phone: '', email: '', address: '', openingBalance: 0 };
    this.showForm = true;
  }

  openEditForm(customer: Customer): void {
    this.editingId = customer.id;
    this.form = {
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      openingBalance: Number(customer.openingBalance || 0)
    };
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.saving = false;
  }

  saveCustomer(): void {
    if (!this.form.name.trim() || !this.form.phone.trim()) {
      this.errorMessage = 'Customer name এবং phone আবশ্যক।';
      return;
    }

    if (this.form.openingBalance < 0) {
      this.errorMessage = 'Opening balance ঋণাত্মক হতে পারবে না।';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      name: this.form.name.trim(),
      phone: this.form.phone.trim(),
      email: this.form.email.trim() || null,
      address: this.form.address.trim() || null,
      openingBalance: Number(this.form.openingBalance || 0)
    };

    const request = this.editingId
      ? this.http.put(this.url(`/${this.editingId}`), payload)
      : this.http.post(this.url(), payload);

    request.subscribe({
      next: () => {
        this.closeForm();
        this.successMessage = this.editingId
          ? 'Customer update হয়েছে।'
          : 'নতুন Customer তৈরি হয়েছে।';
        this.loadCustomers();
      },
      error: error => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'Customer save করা যায়নি।';
      }
    });
  }

  deactivateCustomer(customer: Customer): void {
    if (!confirm(`"${customer.name}" customer-কে deactivate করতে চাও?`)) return;

    this.http.patch(this.url(`/${customer.id}/deactivate`), {}).subscribe({
      next: () => {
        this.successMessage = 'Customer deactivate হয়েছে।';
        this.loadCustomers();
      },
      error: error => {
        this.errorMessage = error?.error?.message || 'Customer deactivate করা যায়নি।';
      }
    });
  }

  viewCustomer(id: number): void {
    this.router.navigate(['/app/stakeholders/customers', id]);
  }

  viewLedger(id: number): void {
    this.router.navigate(
      ['/app/stakeholders/customers/ledger'],
      { queryParams: { customerId: id } }
    );
  }
}
