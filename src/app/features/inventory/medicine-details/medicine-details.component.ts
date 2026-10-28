import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TenantInventoryApiService } from '../../../core/services/tenant-inventory-api.service';
import {
  InventoryBatch,
  InventoryBatchApiService
} from '../../../core/services/inventory-batch-api.service';

interface Medicine {
  id: number;
  name: string;
  generic: string;
  company: string;
  category: string;
  strength: string;
  dosageForm?: string;
  sku: string;
  barcode: string;
  purchasePrice: number;
  unitPrice: number;
  stock: number;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  description?: string;
}

@Component({
  selector: 'app-medicine-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medicine-details.component.html',
  styleUrl: './medicine-details.component.scss'
})
export class MedicineDetailsComponent implements OnInit {
  medicine: Medicine | null = null;
  batches: InventoryBatch[] = [];

  loading = false;
  batchesLoading = false;
  errorMessage = '';
  batchErrorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly inventoryApi: TenantInventoryApiService,
    private readonly batchApi: InventoryBatchApiService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isSafeInteger(id) || id <= 0) {
      this.errorMessage = 'Invalid medicine ID.';
      return;
    }

    this.loadMedicine(id);
  }

  private getTenantId(): number {
    const tenantId = Number(localStorage.getItem('tenantId'));
    return Number.isSafeInteger(tenantId) && tenantId > 0
      ? tenantId
      : 0;
  }

  loadMedicine(id: number): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.errorMessage = 'Tenant ID not found. Please log in again.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.medicine = null;

    this.inventoryApi.get(tenantId, id).subscribe({
      next: item => {
        const stock = Number(item.stockQuantity ?? 0);
        const reorderLevel = Number(item.reorderLevel ?? 0);

        this.medicine = {
          id: item.id,
          name: item.name || '',
          generic: item.genericName || '',
          company: item.brandName || '',
          category: item.category || 'Other',
          strength: item.strength || '',
          dosageForm: item.dosageForm || '',
          sku: item.sku || '',
          barcode: item.barcode || '',
          purchasePrice: Number(item.purchasePrice ?? 0),
          unitPrice: Number(item.sellingPrice ?? 0),
          stock,
          reorderLevel,
          description: item.description || '',
          status: this.getMedicineStatus(stock, reorderLevel)
        };

        this.loading = false;
        this.loadBatches(tenantId, item.id);
      },
      error: err => {
        console.error('Failed to load medicine details:', err);
        this.loading = false;
        this.medicine = null;
        this.errorMessage =
          err?.error?.message ||
          'Could not load this medicine from the backend.';
      }
    });
  }

  private loadBatches(tenantId: number, medicineId: number): void {
    this.batchesLoading = true;
    this.batchErrorMessage = '';

    this.batchApi.list(tenantId, medicineId).subscribe({
      next: batches => {
        this.batches = (Array.isArray(batches) ? batches : [])
          .filter(batch => batch.inventoryItemId === medicineId)
          .sort((a, b) =>
            String(a.expiryDate || '').localeCompare(
              String(b.expiryDate || '')
            )
          );
        this.batchesLoading = false;
      },
      error: err => {
        console.error('Failed to load medicine batches:', err);
        this.batches = [];
        this.batchesLoading = false;
        this.batchErrorMessage =
          err?.error?.message || 'Batch and expiry information could not be loaded.';
      }
    });
  }

  get totalBatchStock(): number {
    return this.batches.reduce(
      (total, batch) => total + Number(batch.quantity || 0),
      0
    );
  }

  get stockMismatch(): boolean {
    return !!this.medicine &&
      !this.batchesLoading &&
      !this.batchErrorMessage &&
      this.batches.length > 0 &&
      this.totalBatchStock !== this.medicine.stock;
  }

  get stockProgress(): number {
    if (!this.medicine || this.medicine.stock <= 0) {
      return 0;
    }

    if (this.medicine.reorderLevel <= 0) {
      return 100;
    }

    const maximum = this.medicine.reorderLevel * 4;
    return Math.min(100, (this.medicine.stock / maximum) * 100);
  }

  getMedicineStatus(
    stock: number,
    reorderLevel: number
  ): Medicine['status'] {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= reorderLevel) return 'Low Stock';
    return 'In Stock';
  }

  getStatusClass(status: Medicine['status']): string {
    switch (status) {
      case 'In Stock':
        return 'in-stock';
      case 'Low Stock':
        return 'low-stock';
      case 'Out of Stock':
        return 'out-of-stock';
      default:
        return '';
    }
  }

  formatBatchDate(date: string | null | undefined): string {
    if (!date) return 'Not recorded';

    const parsed = new Date(`${date.substring(0, 10)}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return 'Not recorded';

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getBatchExpiryStatus(batch: InventoryBatch): string {
    if (!batch.expiryDate) return 'Expiry not recorded';

    const expiry = batch.expiryDate.substring(0, 10);
    const now = new Date();
    const today =
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (expiry < today) return 'Expired';

    const expiryDate = new Date(`${expiry}T00:00:00`);
    const days = Math.ceil(
      (expiryDate.getTime() - new Date(`${today}T00:00:00`).getTime()) /
      86400000
    );

    if (days <= 30) return 'Expires soon';
    return batch.status || 'Active';
  }

  goToStockManagement(destination: 'grn' | 'adjustment' | 'batches'): void {
    if (destination === 'grn') {
      this.router.navigate(['/app/procurement/grn']);
      return;
    }

    if (destination === 'adjustment') {
      this.router.navigate(['/app/inventory/stock-adjustment']);
      return;
    }

    this.router.navigate(['/app/inventory/batches']);
  }

  goBack(): void {
    this.router.navigate(['/app/inventory/medicines']);
  }

  editMedicine(): void {
    if (!this.medicine) return;

    this.router.navigate([
      '/app/inventory/medicines',
      this.medicine.id,
      'edit'
    ]);
  }
}
