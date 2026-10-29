import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  SaleApiService,
  SaleReturnResponse
} from '../../../core/services/sale-api.service';

type DateRange = 'today' | 'week' | 'month' | 'all';
type StockFilter = 'all' | 'quarantined' | 'restocked';

@Component({
  selector: 'app-returns-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './returns-report.component.html',
  styleUrl: './returns-report.component.scss'
})
export class ReturnsReportComponent implements OnInit {
  private readonly saleApi = inject(SaleApiService);

  returns: SaleReturnResponse[] = [];
  selectedRange: DateRange = 'month';
  stockFilter: StockFilter = 'all';
  searchTerm = '';
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.refreshReport();
  }

  private resolveTenantId(): number {
    const validId = (value: unknown): number => {
      const id = Number(value);
      return Number.isInteger(id) && id > 0 ? id : 0;
    };

    for (const key of ['tenantId', 'tenant_id']) {
      const id = validId(localStorage.getItem(key));
      if (id) return id;
    }

    for (const key of ['pharm_user', 'currentTenant', 'tenant']) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const rawId = validId(raw);
      if (rawId) return rawId;

      try {
        const data = JSON.parse(raw) as {
          id?: number | string;
          tenantId?: number | string;
          tenant_id?: number | string;
          selectedTenantId?: number | string;
          activeTenantId?: number | string;
          tenant?: { id?: number | string } | null;
          currentTenant?: { id?: number | string } | null;
        };

        const candidates: unknown[] = [
          data.tenantId,
          data.tenant_id,
          data.selectedTenantId,
          data.activeTenantId,
          data.tenant?.id,
          data.currentTenant?.id
        ];

        if (key === 'currentTenant' || key === 'tenant') {
          candidates.unshift(data.id);
        }

        for (const candidate of candidates) {
          const id = validId(candidate);
          if (id) return id;
        }
      } catch {
        // Ignore invalid JSON and check the next supported key.
      }
    }

    return 0;
  }

  refreshReport(): void {
    const tenantId = this.resolveTenantId();

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      this.loading = false;
      this.returns = [];
      this.errorMessage =
        'Tenant information is missing. Please log in and select your pharmacy again.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.saleApi.listReturns(tenantId).subscribe({
      next: records => {
        this.returns = Array.isArray(records) ? records : [];
        this.loading = false;
      },
      error: error => {
        console.error('Failed to load Sales Returns Report:', error);
        this.returns = [];
        this.errorMessage =
          'Returns Report could not be loaded. Check your login and backend connection.';
        this.loading = false;
      }
    });
  }

  get filteredReturns(): SaleReturnResponse[] {
    const query = this.searchTerm.trim().toLowerCase();

    return this.returns.filter(record => {
      if (!this.isInSelectedPeriod(record.createdAt)) {
        return false;
      }

      const items = record.items || [];
      if (
        this.stockFilter === 'quarantined' &&
        !items.some(item =>
          String(item.stockDisposition || '').toUpperCase() === 'QUARANTINED'
        )
      ) {
        return false;
      }

      if (
        this.stockFilter === 'restocked' &&
        !items.some(item =>
          String(item.stockDisposition || '').toUpperCase() === 'RESTOCKED'
        )
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        record.refundNumber,
        record.invoiceNumber,
        record.customerName,
        record.reason,
        record.cashierName
      ].some(value => String(value || '').toLowerCase().includes(query))
        || items.some(item =>
          String(item.productName || '').toLowerCase().includes(query) ||
          String(item.batchNumber || '').toLowerCase().includes(query)
        );
    });
  }

  get totalRefunded(): number {
    return this.filteredReturns.reduce(
      (sum, record) => sum + Math.max(0, Number(record.refundAmount || 0)),
      0
    );
  }

  get totalReturns(): number {
    return this.filteredReturns.length;
  }

  get totalReturnedQuantity(): number {
    return this.filteredReturns.reduce(
      (sum, record) => sum + this.returnedQuantity(record),
      0
    );
  }

  get quarantinedQuantity(): number {
    return this.filteredReturns.reduce(
      (sum, record) => sum + (record.items || [])
        .filter(item =>
          String(item.stockDisposition || '').toUpperCase() === 'QUARANTINED'
        )
        .reduce((itemSum, item) =>
          itemSum + Math.max(0, Number(item.quantity || 0)), 0),
      0
    );
  }

  returnedQuantity(record: SaleReturnResponse): number {
    return (record.items || []).reduce(
      (sum, item) => sum + Math.max(0, Number(item.quantity || 0)),
      0
    );
  }

  getStockLabel(record: SaleReturnResponse): string {
    const states = [...new Set(
      (record.items || []).map(item =>
        String(item.stockDisposition || 'UNKNOWN').toUpperCase()
      )
    )];

    if (!states.length) return 'Not recorded';
    if (states.length > 1) return 'Mixed';
    if (states[0] === 'QUARANTINED') return 'Quarantined';
    if (states[0] === 'RESTOCKED') return 'Restocked';

    return states[0]
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  getStockClass(record: SaleReturnResponse): string {
    const label = this.getStockLabel(record).toLowerCase();

    if (label === 'quarantined') return 'status-quarantined';
    if (label === 'restocked') return 'status-restocked';
    return 'status-mixed';
  }

  formatReturnStatus(value: string | null | undefined): string {
    if (!value || !String(value).trim()) return 'Not recorded';

    return String(value)
      .trim()
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }

  formatItems(record: SaleReturnResponse): string {
    const items = record.items || [];

    if (!items.length) return 'No item details';

    return items.map(item =>
      `${item.productName || 'Product'} × ${item.quantity}`
    ).join(', ');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number.isFinite(value) ? value : 0);
  }

  formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return 'Date unavailable';

    return new Intl.DateTimeFormat('en-BD', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  trackByReturn(index: number, record: SaleReturnResponse): number {
    return record.id || index;
  }

  exportCsv(): void {
    const headers = [
      'Refund Number',
      'Date',
      'Invoice Number',
      'Customer',
      'Reason',
      'Items',
      'Returned Quantity',
      'Refund Amount',
      'Cashier',
      'Stock Disposition',
      'Status'
    ];

    const rows = this.filteredReturns.map(record => [
      record.refundNumber,
      record.createdAt,
      record.invoiceNumber,
      record.customerName,
      record.reason,
      this.formatItems(record),
      this.returnedQuantity(record),
      Number(record.refundAmount || 0).toFixed(2),
      record.cashierName || '',
      this.getStockLabel(record),
      record.status
    ]);

    const escapeCsv = (value: unknown): string =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCsv).join(','))
      .join('\r\n');

    const blob = new Blob(['\uFEFF', csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `sales-returns-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  private isInSelectedPeriod(value: string): boolean {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return false;
    if (this.selectedRange === 'all') return true;

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (this.selectedRange === 'week') {
      const day = start.getDay();
      start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
    } else if (this.selectedRange === 'month') {
      start.setDate(1);
    }

    const end = new Date(
      now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999
    );

    return date >= start && date <= end;
  }
}
