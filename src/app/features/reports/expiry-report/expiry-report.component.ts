import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import {
  InventoryBatchApiService,
  InventoryBatch
} from '../../../core/services/inventory-batch-api.service';

import {
  TenantInventoryApiService,
  TenantInventoryItem
} from '../../../core/services/tenant-inventory-api.service';

interface ExpiryReportItem {
  id: string;
  name: string;
  genericName: string;
  category: string;
  company: string;
  batchNumber: string;
  quantity: number;
  expiryDate: Date | null;
  daysRemaining: number | null;
  status: 'Expired' | 'Critical' | 'Expiring Soon' | 'Safe';
  stockValue: number;
}

@Component({
  selector: 'app-expiry-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expiry-report.component.html',
  styleUrl: './expiry-report.component.scss'
})
export class ExpiryReportComponent implements OnInit {
  private readonly batchApi = inject(InventoryBatchApiService);
  private readonly inventoryApi = inject(TenantInventoryApiService);

  expiryItems: ExpiryReportItem[] = [];
  filteredItems: ExpiryReportItem[] = [];

  searchTerm = '';
  selectedStatus = 'All';

  totalItems = 0;
  totalQuantity = 0;
  totalStockValue = 0;

  expiredCount = 0;
  criticalCount = 0;
  expiringSoonCount = 0;
  safeCount = 0;

  lastUpdated = new Date();
  loading = false;

  ngOnInit(): void {
    this.loadExpiryReport();
  }

  loadExpiryReport(): void {
    const tenantId = Number(localStorage.getItem('tenantId'));

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      this.expiryItems = [];
      this.calculateSummary();
      this.applyFilters();
      console.error('Expiry Report: a valid tenantId was not found.');
      alert('Tenant information is missing. Please log in and select your pharmacy again.');
      return;
    }

    this.loading = true;

    forkJoin({
      batches: this.batchApi.list(tenantId),
      medicines: this.inventoryApi.list(tenantId)
    }).subscribe({
      next: ({ batches, medicines }) => {
        const inventoryById = new Map<number, TenantInventoryItem>(
          (Array.isArray(medicines) ? medicines : [])
            .map(medicine => [Number(medicine.id), medicine])
        );

        this.expiryItems = (Array.isArray(batches) ? batches : [])
          .map(batch => this.mapBatchToExpiryItem(batch, inventoryById))
          .filter((item): item is ExpiryReportItem => item !== null)
          .sort((a, b) => {
            const dateA = a.expiryDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const dateB = b.expiryDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
            return dateA - dateB;
          });

        this.calculateSummary();
        this.applyFilters();
        this.lastUpdated = new Date();
        this.loading = false;
      },
      error: error => {
        console.error('Unable to load Expiry Report from backend:', error);
        this.expiryItems = [];
        this.calculateSummary();
        this.applyFilters();
        this.loading = false;
        alert('Expiry Report could not be loaded. Please check your login and backend connection.');
      }
    });
  }

  private mapBatchToExpiryItem(
    batch: InventoryBatch,
    inventoryById: Map<number, TenantInventoryItem>
  ): ExpiryReportItem | null {
    const expiryDate = this.parseDate(batch.expiryDate);

    // A batch without a usable expiry date cannot be classified.
    if (!expiryDate) {
      return null;
    }

    const medicine = inventoryById.get(Number(batch.inventoryItemId));
    const quantity = this.getNumber(batch.quantity);
    const purchasePrice = this.getNumber(batch.purchasePrice);
    const daysRemaining = this.getDaysRemaining(expiryDate);

    return {
      id: String(batch.id),
      name: batch.medicineName || medicine?.name || 'Unknown Medicine',
      genericName: medicine?.genericName || '-',
      category: medicine?.category || 'Other',
      company: medicine?.brandName || '-',
      batchNumber: batch.batchNumber || '-',
      quantity,
      expiryDate,
      daysRemaining,
      status: this.getExpiryStatus(daysRemaining),
      stockValue: quantity * purchasePrice
    };
  }

  private parseDate(value: unknown): Date | null {
    if (!value || typeof value !== 'string') {
      return null;
    }

    // Parse date-only strings in local time to avoid timezone shifts.
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

    let date: Date;

    if (match) {
      date = new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      );

      if (
        date.getFullYear() !== Number(match[1]) ||
        date.getMonth() !== Number(match[2]) - 1 ||
        date.getDate() !== Number(match[3])
      ) {
        return null;
      }
    } else {
      date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return null;
      }
    }

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private getDaysRemaining(expiryDate: Date): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    return Math.ceil(
      (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  private getExpiryStatus(
    daysRemaining: number | null
  ): 'Expired' | 'Critical' | 'Expiring Soon' | 'Safe' {
    if (daysRemaining === null) {
      return 'Safe';
    }

    if (daysRemaining < 0) {
      return 'Expired';
    }

    if (daysRemaining <= 30) {
      return 'Critical';
    }

    if (daysRemaining <= 90) {
      return 'Expiring Soon';
    }

    return 'Safe';
  }

  calculateSummary(): void {
    this.totalItems = this.expiryItems.length;

    this.totalQuantity = this.expiryItems.reduce(
      (total, item) => total + item.quantity,
      0
    );

    this.totalStockValue = this.expiryItems.reduce(
      (total, item) => total + item.stockValue,
      0
    );

    this.expiredCount = this.expiryItems.filter(
      item => item.status === 'Expired'
    ).length;

    this.criticalCount = this.expiryItems.filter(
      item => item.status === 'Critical'
    ).length;

    this.expiringSoonCount = this.expiryItems.filter(
      item => item.status === 'Expiring Soon'
    ).length;

    this.safeCount = this.expiryItems.filter(
      item => item.status === 'Safe'
    ).length;
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredItems = this.expiryItems.filter(item => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.genericName.toLowerCase().includes(search) ||
        item.company.toLowerCase().includes(search) ||
        item.batchNumber.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        item.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'All';
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Expired': return 'status-expired';
      case 'Critical': return 'status-critical';
      case 'Expiring Soon': return 'status-soon';
      case 'Safe': return 'status-safe';
      default: return '';
    }
  }

  getDaysLabel(days: number | null): string {
    if (days === null) {
      return '-';
    }

    if (days < 0) {
      const expiredDays = Math.abs(days);
      return expiredDays === 1 ? '1 day ago' : `${expiredDays} days ago`;
    }

    if (days === 0) {
      return 'Expires today';
    }

    return days === 1 ? '1 day left' : `${days} days left`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  private getNumber(value: unknown): number {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  refresh(): void {
    this.loadExpiryReport();
  }

  exportReport(): void {
    if (!this.filteredItems.length) {
      return;
    }

    const headers = [
      'Medicine',
      'Generic Name',
      'Category',
      'Company',
      'Batch',
      'Quantity',
      'Expiry Date',
      'Days Remaining',
      'Stock Value',
      'Status'
    ];

    const rows = this.filteredItems.map(item => [
      item.name,
      item.genericName,
      item.category,
      item.company,
      item.batchNumber,
      item.quantity,
      item.expiryDate ? this.formatDate(item.expiryDate) : '-',
      item.daysRemaining ?? '-',
      item.stockValue,
      item.status
    ]);

    const csv = [headers, ...rows]
      .map(row =>
        row
          .map(value => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `expiry-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }
}
