import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { TenantInventoryApiService } from '../../../core/services/tenant-inventory-api.service';
import { InventoryBatchApiService } from '../../../core/services/inventory-batch-api.service';

type BatchStatus = 'Good' | 'Expiring Soon' | 'Expired' | 'Out of Stock';

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
  status: BatchStatus;
}

@Component({
  selector: 'app-batch-expiry-grid',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './batch-expiry-grid.component.html',
  styleUrl: './batch-expiry-grid.component.scss'
})
export class BatchExpiryGridComponent implements OnInit {
  constructor(
    private readonly inventoryApi: TenantInventoryApiService,
    private readonly batchApi: InventoryBatchApiService,
    private readonly router: Router
  ) {}

  searchTerm = '';
  selectedStatus = 'All';
  batches: Batch[] = [];
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    const tenantId = Number(localStorage.getItem('tenantId'));

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      this.batches = [];
      this.errorMessage = 'Tenant ID not found. Please log in again.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      batches: this.batchApi.list(tenantId),
      medicines: this.inventoryApi.list(tenantId)
    }).subscribe({
      next: ({ batches, medicines }) => {
        const medicineMap = new Map(
          medicines.map(medicine => [medicine.id, medicine])
        );

        this.batches = batches.map(batch => {
          const medicine = medicineMap.get(batch.inventoryItemId);
          const quantity = Number(batch.quantity || 0);

          return {
            id: batch.id,
            medicineId: batch.inventoryItemId,
            medicineName: batch.medicineName || medicine?.name || 'Unknown medicine',
            generic: medicine?.genericName || '',
            batchNumber: batch.batchNumber,
            expiryDate: batch.expiryDate,
            quantity,
            purchasePrice: Number(batch.purchasePrice || 0),
            sellingPrice: Number(medicine?.sellingPrice || 0),
            supplier: '—',
            status: this.calculateStatus(batch.expiryDate, quantity)
          };
        });

        this.loading = false;
      },
      error: error => {
        console.error('Failed to load inventory batches', error);
        this.batches = [];
        this.loading = false;
        this.errorMessage =
          error?.error?.message ||
          'Could not load batches. Check your login, tenant access and backend connection.';
      }
    });
  }

  private calculateStatus(expiryDate: string, quantity: number): BatchStatus {
    const days = this.getDaysUntilExpiry(expiryDate);

    if (days < 0) return 'Expired';
    if (quantity <= 0) return 'Out of Stock';
    if (days <= 90) return 'Expiring Soon';

    return 'Good';
  }

  get filteredBatches(): Batch[] {
    const term = this.searchTerm.toLowerCase().trim();

    return this.batches.filter(batch => {
      const matchesSearch =
        !term ||
        batch.medicineName.toLowerCase().includes(term) ||
        batch.generic.toLowerCase().includes(term) ||
        batch.batchNumber.toLowerCase().includes(term) ||
        batch.supplier.toLowerCase().includes(term);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        batch.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  get totalBatches(): number {
    return this.batches.length;
  }

  get totalQuantity(): number {
    return this.batches.reduce((total, batch) => total + batch.quantity, 0);
  }

  get expiringSoonCount(): number {
    return this.batches.filter(batch => batch.status === 'Expiring Soon').length;
  }

  get expiredCount(): number {
    return this.batches.filter(batch => batch.status === 'Expired').length;
  }

  selectStatus(status: string): void {
    this.selectedStatus = status;
  }

  getStatusClass(status: BatchStatus): string {
    switch (status) {
      case 'Good': return 'good';
      case 'Expiring Soon': return 'expiring';
      case 'Expired': return 'expired';
      case 'Out of Stock': return 'out-of-stock';
      default: return '';
    }
  }

  formatDate(date: string): string {
    if (!date) return '—';

    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return '—';

    return parsed.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  getDaysUntilExpiry(expiryDate: string): number {
    if (!expiryDate) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(`${expiryDate}T00:00:00`);
    if (Number.isNaN(expiry.getTime())) return 0;

    return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  }

  addBatch(): void {
    this.router.navigate(['/app/inventory/batches/new']);
  }

  viewMedicine(batch: Batch): void {
    this.router.navigate(['/app/inventory/medicines', batch.medicineId]);
  }

  goBack(): void {
    this.router.navigate(['/app/inventory/medicines']);
  }
}
