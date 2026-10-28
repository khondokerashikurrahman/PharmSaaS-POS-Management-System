import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SaleApiService,
  SaleReturnResponse
} from '../../../core/services/sale-api.service';

interface ReturnedStockRow {
  returnId: number;
  returnItemId: number;
  refundNumber: string;
  invoiceNumber: string;
  customerName: string;
  reason: string;
  productId: number;
  productName: string;
  batchId: number;
  batchNumber: string;
  quantity: number;
  refundAmount: number;
  stockDisposition: 'QUARANTINED' | 'RESTOCKED' | string;
  createdAt: string;
}

@Component({
  selector: 'app-returned-stock',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './returned-stock.component.html',
  styleUrl: './returned-stock.component.scss'
})
export class ReturnedStockComponent implements OnInit {
  private readonly saleApi = inject(SaleApiService);

  rows: ReturnedStockRow[] = [];
  searchTerm = '';
  selectedDisposition = 'QUARANTINED';
  loading = false;
  processingItemId: number | null = null;
  loadError = '';

  ngOnInit(): void {
    this.loadReturns();
  }

  get filteredRows(): ReturnedStockRow[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.rows.filter(row => {
      const matchesStatus =
        this.selectedDisposition === 'ALL' ||
        row.stockDisposition.toUpperCase() === this.selectedDisposition;

      const matchesSearch =
        !term ||
        row.productName.toLowerCase().includes(term) ||
        row.batchNumber.toLowerCase().includes(term) ||
        row.invoiceNumber.toLowerCase().includes(term) ||
        row.refundNumber.toLowerCase().includes(term) ||
        row.customerName.toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }

  get quarantinedCount(): number {
    return this.rows.filter(
      row => row.stockDisposition.toUpperCase() === 'QUARANTINED'
    ).length;
  }

  get restockedCount(): number {
    return this.rows.filter(
      row => row.stockDisposition.toUpperCase() === 'RESTOCKED'
    ).length;
  }

  get quarantinedQuantity(): number {
    return this.rows
      .filter(row => row.stockDisposition.toUpperCase() === 'QUARANTINED')
      .reduce((sum, row) => sum + row.quantity, 0);
  }

  loadReturns(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.rows = [];
      this.loadError = 'Tenant information is missing. Please log in again.';
      return;
    }

    this.loading = true;
    this.loadError = '';

    this.saleApi.listReturns(tenantId).subscribe({
      next: returns => {
        this.rows = (Array.isArray(returns) ? returns : [])
          .flatMap((refund: SaleReturnResponse) =>
            (refund.items || []).map(item => ({
              returnId: refund.id,
              returnItemId: item.returnItemId,
              refundNumber: refund.refundNumber || `RET-${refund.id}`,
              invoiceNumber: refund.invoiceNumber || `SALE-${refund.saleId}`,
              customerName: refund.customerName || 'Walk-in Customer',
              reason: refund.reason || 'Not recorded',
              productId: item.productId,
              productName: item.productName || 'Unknown medicine',
              batchId: item.batchId,
              batchNumber: item.batchNumber || 'N/A',
              quantity: Number(item.quantity || 0),
              refundAmount: Number(item.refundAmount || 0),
              stockDisposition: item.stockDisposition || 'QUARANTINED',
              createdAt: refund.createdAt || ''
            }))
          )
          .sort((a, b) => b.returnId - a.returnId);

        this.loading = false;
      },
      error: error => {
        console.error('Failed to load returned stock:', error);
        this.rows = [];
        this.loadError =
          error?.error?.detail ||
          error?.error?.message ||
          'Returned stock could not be loaded. Check your login and backend connection.';
        this.loading = false;
      }
    });
  }

  restock(row: ReturnedStockRow): void {
    if (row.stockDisposition.toUpperCase() !== 'QUARANTINED') {
      return;
    }

    const confirmed = confirm(
      `Release ${row.quantity} unit(s) of ${row.productName} ` +
      `(batch ${row.batchNumber}) into sellable stock after inspection?\n\n` +
      'The backend will reject expired or undated batches and inactive products.'
    );

    if (!confirmed) {
      return;
    }

    const tenantId = this.getTenantId();
    if (!tenantId) {
      alert('Tenant information is missing. Please log in again.');
      return;
    }

    this.processingItemId = row.returnItemId;

    this.saleApi
      .restockReturnedItem(tenantId, row.returnId, row.returnItemId)
      .subscribe({
        next: response => {
          this.processingItemId = null;
          alert(
            `Stock released successfully. Refund reference: ${response.refundNumber}.`
          );
          this.loadReturns();
        },
        error: error => {
          this.processingItemId = null;
          alert(
            error?.error?.detail ||
            error?.error?.message ||
            'Stock could not be released. The batch may be expired, inactive, or already processed.'
          );
        }
      });
  }

  refresh(): void {
    this.loadReturns();
  }

  formatDate(value: string): string {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleString('en-GB');
  }

  private getTenantId(): number {
    let tenantId = Number(localStorage.getItem('tenantId'));

    if (!Number.isSafeInteger(tenantId) || tenantId <= 0) {
      try {
        tenantId = Number(
          JSON.parse(localStorage.getItem('pharm_user') || '{}').tenantId
        );
      } catch {
        tenantId = 0;
      }
    }

    return Number.isSafeInteger(tenantId) && tenantId > 0
      ? tenantId
      : 0;
  }
}
