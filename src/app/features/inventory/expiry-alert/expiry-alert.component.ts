
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TenantInventoryApiService } from '../../../core/services/tenant-inventory-api.service';
import { InventoryBatchApiService } from '../../../core/services/inventory-batch-api.service';

interface Batch {
  id: number;
  medicineId: number;
  medicineName: string;
  generic: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
  supplier: string;
  status?: 'Good' | 'Expiring Soon' | 'Expired' | 'Out of Stock';
}

@Component({
  selector: 'app-expiry-alert',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './expiry-alert.component.html',
  styleUrl: './expiry-alert.component.scss'
})
export class ExpiryAlertComponent implements OnInit {

  batches: Batch[] = [];

  searchTerm = '';
  selectedStatus = 'All';

  statuses = [
    'All',
    'Expired',
    'Expiring Soon',
    'Out of Stock'
  ];

  loading = false;
  errorMessage = '';

  constructor(
    private inventoryApi: TenantInventoryApiService,
    private batchApi: InventoryBatchApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    const tenantId = Number(localStorage.getItem('tenantId'));

    if (!Number.isSafeInteger(tenantId) || tenantId <= 0) {
      this.batches = [];
      this.errorMessage = 'Tenant ID not found. Please log in again.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      medicines: this.inventoryApi.list(tenantId),
      batches: this.batchApi.list(tenantId)
    }).subscribe({
      next: ({ medicines, batches }) => {
        const medicinesById = new Map(
          medicines.map(item => [item.id, item] as const)
        );

        this.batches = (Array.isArray(batches) ? batches : []).map(batch => {
          const medicine = medicinesById.get(batch.inventoryItemId);
          const expiryDate = String(batch.expiryDate || '');
          const quantity = Number(batch.quantity ?? 0);

          return {
            id: batch.id,
            medicineId: batch.inventoryItemId,
            medicineName: batch.medicineName || medicine?.name || 'Unknown medicine',
            generic: medicine?.genericName || '',
            batchNumber: batch.batchNumber || '',
            expiryDate,
            quantity,
            purchasePrice: Number(batch.purchasePrice ?? 0),
            sellingPrice: Number(medicine?.sellingPrice ?? 0),
            supplier: 'Not recorded',
            status: this.calculateStatus(expiryDate, quantity)
          };
        });

        this.loading = false;
      },
      error: err => {
        console.error('Failed to load expiry batches:', err);
        this.batches = [];
        this.loading = false;
        this.errorMessage =
          err?.error?.message || 'Could not load batch expiry data from the backend.';
      }
    });
  }

  calculateStatus(
    expiryDate: string,
    quantity: number
  ): Batch['status'] {

    if (quantity <= 0) {
      return 'Out of Stock';
    }

    const days = this.getDaysUntilExpiry(expiryDate);

    if (days < 0) {
      return 'Expired';
    }

    if (days <= 90) {
      return 'Expiring Soon';
    }

    return 'Good';
  }

  get filteredBatches(): Batch[] {

    const term =
      this.searchTerm.toLowerCase().trim();

    return this.batches.filter(batch => {

      const isAlert =
        batch.status === 'Expired' ||
        batch.status === 'Expiring Soon' ||
        batch.status === 'Out of Stock';

      if (!isAlert) {
        return false;
      }

      const matchesSearch =
        !term ||
        batch.medicineName
          .toLowerCase()
          .includes(term) ||
        batch.generic
          .toLowerCase()
          .includes(term) ||
        batch.batchNumber
          .toLowerCase()
          .includes(term) ||
        batch.supplier
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        batch.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  get expiredBatches(): Batch[] {

    return this.batches.filter(
      batch => batch.status === 'Expired'
    );
  }

  get expiringSoonBatches(): Batch[] {

    return this.batches.filter(
      batch => batch.status === 'Expiring Soon'
    );
  }

  get outOfStockBatches(): Batch[] {

    return this.batches.filter(
      batch => batch.status === 'Out of Stock'
    );
  }

  get totalAlertBatches(): number {
    return this.filteredBatches.length;
  }

  get totalExpired(): number {
    return this.expiredBatches.length;
  }

  get totalExpiringSoon(): number {
    return this.expiringSoonBatches.length;
  }

  get totalExpiredUnits(): number {

    return this.expiredBatches.reduce(
      (total, batch) =>
        total + batch.quantity,
      0
    );
  }

  get totalAtRiskValue(): number {

    return this.filteredBatches.reduce(
      (total, batch) =>
        total +
        batch.quantity *
        batch.sellingPrice,
      0
    );
  }

  selectStatus(status: string): void {
    this.selectedStatus = status;
  }

  getDaysUntilExpiry(
    expiryDate: string
  ): number {

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );

    const expiry = new Date(
      expiryDate
    );

    expiry.setHours(
      0,
      0,
      0,
      0
    );

    const difference =
      expiry.getTime() -
      today.getTime();

    return Math.ceil(
      difference /
      (1000 * 60 * 60 * 24)
    );
  }

  formatDate(
    date: string
  ): string {

    return new Date(date).toLocaleDateString(
      'en-GB',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );
  }

  getDaysLabel(
    expiryDate: string
  ): string {

    const days =
      this.getDaysUntilExpiry(
        expiryDate
      );

    if (days < 0) {
      return `${Math.abs(days)} days overdue`;
    }

    if (days === 0) {
      return 'Expires today';
    }

    if (days === 1) {
      return 'Expires tomorrow';
    }

    return `${days} days left`;
  }

  getStatusClass(
    status: Batch['status']
  ): string {

    switch (status) {
      case 'Expired':
        return 'expired';

      case 'Expiring Soon':
        return 'expiring';

      case 'Out of Stock':
        return 'out-of-stock';

      case 'Good':
        return 'good';

      default:
        return '';
    }
  }

  viewMedicine(
    batch: Batch
  ): void {

    this.router.navigate([
      '/app/inventory/medicines',
      batch.medicineId
    ]);
  }

  viewBatch(
    batch: Batch
  ): void {

    this.router.navigate([
      '/app/inventory/batches'
    ]);
  }

  goToStockAdjustment(): void {

    this.router.navigate([
      '/app/inventory/stock-adjustment'
    ]);
  }

  goBack(): void {

    this.router.navigate([
      '/app/inventory/medicines'
    ]);
  }
}
