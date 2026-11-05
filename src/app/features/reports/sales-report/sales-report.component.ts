import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  SaleApiService,
  SaleResponse,
  SaleReturnResponse
} from '../../../core/services/sale-api.service';

type SaleStatus = 'Completed' | 'Partially Refunded' | 'Refunded' | string;
type PaymentMethod = 'Cash' | 'Card' | 'Mobile' | 'Not recorded';

interface Sale {
  id: number;
  invoice: string;
  date: Date;
  customer: string;
  items: number;
  payment: PaymentMethod;
  total: number;
  grossTotal: number;
  refundAmount: number;
  returnedItems: number;
  status: SaleStatus;
}

type DateRange = 'today' | 'week' | 'month' | 'custom' | 'all';

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-report.component.html',
  styleUrls: ['./sales-report.component.scss']
})
export class SalesReportComponent implements OnInit {
  private readonly saleApi = inject(SaleApiService);

  sales: Sale[] = [];
  loading = false;
  loadError = '';
  selectedRange: DateRange = 'all';
  fromDate = '';
  toDate = '';

  ngOnInit(): void {
    this.refreshReport();
  }

  refreshReport(): void {
    const tenantId = this.getTenantId();

    if (!Number.isSafeInteger(tenantId) || tenantId <= 0) {
      this.sales = [];
      this.loading = false;
      this.loadError = 'Tenant information is missing. Please log in and select your pharmacy again.';
      console.error('Sales Report: no valid tenant ID was found.');
      return;
    }

    this.loading = true;
    this.loadError = '';
    this.sales = [];

    forkJoin({
      sales: this.saleApi.getSales(tenantId),
      returns: this.saleApi.listReturns(tenantId)
    }).subscribe({
      next: ({ sales, returns }) => {
        const returnsBySale = new Map<number, SaleReturnResponse[]>();

        for (const record of Array.isArray(returns) ? returns : []) {
          const id = Number(record.saleId);
          const existing = returnsBySale.get(id) || [];
          existing.push(record);
          returnsBySale.set(id, existing);
        }

        this.sales = (Array.isArray(sales) ? sales : []).map(
          sale => this.mapSale(sale, returnsBySale.get(Number(sale.id)) || [])
        );
        this.loading = false;
      },
      error: error => {
        console.error('Failed to load Sales Report/refund data:', error);
        this.sales = [];
        this.loading = false;
        this.loadError =
          error?.error?.detail ||
          error?.error?.message ||
          'Sales Report could not be loaded. Check your login and backend connection.';
      }
    });
  }

  private getTenantId(): number {
    const directValues = [
      localStorage.getItem('tenantId'),
      localStorage.getItem('tenant_id')
    ];

    for (const raw of directValues) {
      const id = Number(raw);
      if (Number.isSafeInteger(id) && id > 0) {
        return id;
      }
    }

    for (const key of ['pharm_user', 'currentTenant', 'current_tenant']) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        const candidates = [
          data?.tenantId,
          data?.tenant_id,
          data?.tenant?.id,
          data?.currentTenant?.id,
          key === 'currentTenant' || key === 'current_tenant' ? data?.id : null
        ];

        for (const candidate of candidates) {
          const id = Number(candidate);
          if (Number.isSafeInteger(id) && id > 0) {
            return id;
          }
        }
      } catch {
        // Try the next known storage key.
      }
    }

    return 0;
  }

  private mapSale(
    sale: SaleResponse,
    returns: SaleReturnResponse[]
  ): Sale {
    const rawStatus = String(sale.status || '').trim().toUpperCase();
    const rawPayment = String(sale.paymentMethod || '').trim().toUpperCase();

    const grossTotal = Math.max(0, Number(sale.total || 0));
    const recordedRefund = (returns || []).reduce(
      (sum, record) => sum + Math.max(0, Number(record.refundAmount || 0)), 0
    );

    // Older fully-refunded records may not have detailed return rows.
    const refundAmount = Math.min(
      grossTotal,
      recordedRefund > 0 ? recordedRefund :
        rawStatus === 'REFUNDED' ? grossTotal : 0
    );

    let status: SaleStatus;
    if (rawStatus === 'REFUNDED' ||
        (grossTotal > 0 && refundAmount >= grossTotal - 0.01)) {
      status = 'Refunded';
    } else if (refundAmount > 0 || rawStatus === 'PARTIALLY_REFUNDED') {
      status = 'Partially Refunded';
    } else if (['COMPLETED', 'COMPLETE', 'SUCCESS', 'PAID'].includes(rawStatus)) {
      status = 'Completed';
    } else {
      status = rawStatus
        ? rawStatus.charAt(0) + rawStatus.slice(1).toLowerCase()
        : 'Unknown';
    }

    let payment: PaymentMethod;
    if (rawPayment === 'CASH') {
      payment = 'Cash';
    } else if (rawPayment === 'CARD') {
      payment = 'Card';
    } else if (
      rawPayment === 'MOBILE' ||
      rawPayment.includes('BKASH') ||
      rawPayment.includes('NAGAD') ||
      rawPayment.includes('MOBILE')
    ) {
      payment = 'Mobile';
    } else {
      payment = 'Not recorded';
    }

    const parsedDate = sale.createdAt ? new Date(sale.createdAt) : new Date();
    const returnedItems = (returns || []).reduce(
      (sum, record) => sum + (record.items || []).reduce(
        (itemSum, item) => itemSum + Math.max(0, Number(item.quantity || 0)), 0
      ), 0
    );

    return {
      id: Number(sale.id),
      invoice: sale.invoiceNumber || `INV-${sale.id}`,
      date: Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
      customer: sale.customerName || 'Walk-in Customer',
      items: (sale.items || []).reduce(
        (sum, item) => sum + Number(item.quantity || 0), 0
      ),
      payment,
      grossTotal,
      refundAmount,
      returnedItems,
      total: Math.max(0, grossTotal - refundAmount),
      status
    };
  }


  downloadingReport = false;

  downloadPresetJasperReport(period: 'daily' | 'weekly' | 'three-months' | 'six-months' | 'annual'): void {
    const tenantId = this.getTenantId();
    if (!Number.isSafeInteger(tenantId) || tenantId <= 0) {
      alert('Tenant information is missing. Please select your pharmacy again.');
      return;
    }
    if (this.downloadingReport) return;

    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const start = new Date(end);
    let label = '';

    switch (period) {
      case 'daily':
        label = 'Daily Sales';
        break;
      case 'weekly': {
        const day = start.getDay();
        start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
        label = 'Weekly Sales';
        break;
      }
      case 'three-months':
        start.setMonth(start.getMonth() - 3);
        label = '3 Months Sales';
        break;
      case 'six-months':
        start.setMonth(start.getMonth() - 6);
        label = '6 Months Sales';
        break;
      case 'annual':
        start.setMonth(0, 1);
        label = 'Annual Sales';
        break;
    }

    const toIsoDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const startDate = toIsoDate(start);
    const endDate = toIsoDate(end);
    this.downloadingReport = true;

    this.saleApi.downloadSalesRangePdf(tenantId, startDate, endDate, label).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sales-report-${period}-${startDate}-to-${endDate}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        this.downloadingReport = false;
      },
      error: error => {
        console.error('Jasper sales report download failed:', error);
        this.downloadingReport = false;
        alert('Jasper Sales Report download failed. Please check your login and backend connection.');
      }
    });
  }

  selectRange(range: 'today' | 'week' | 'month' | 'all'): void {
    this.selectedRange = range;
  }

  applyCustomDate(): void {
    if (!this.fromDate || !this.toDate) {
      alert('Please select both From Date and To Date.');
      return;
    }

    if (this.fromDate > this.toDate) {
      alert('From Date cannot be later than To Date.');
      return;
    }

    this.selectedRange = 'custom';
  }

  get filteredSales(): Sale[] {
    const now = new Date();
    let start: Date | null = null;
    let end: Date | null = null;

    switch (this.selectedRange) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(
          now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999
        );
        break;

      case 'week': {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const day = start.getDay();
        start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
        end = now;
        break;
      }

      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = now;
        break;

      case 'custom':
        start = new Date(`${this.fromDate}T00:00:00`);
        end = new Date(`${this.toDate}T23:59:59.999`);
        break;

      case 'all':
      default:
        return [...this.sales];
    }

    if (!start || !end) {
      return [...this.sales];
    }

    return this.sales.filter(
      sale => sale.date >= start! && sale.date <= end!
    );
  }

  get completedSales(): Sale[] {
    return this.filteredSales.filter(
      sale => (sale.status === 'Completed' ||
               sale.status === 'Partially Refunded') &&
              sale.total > 0
    );
  }

  get refundedSales(): Sale[] {
    return this.filteredSales.filter(
      sale => sale.refundAmount > 0 || sale.status === 'Refunded'
    );
  }

  get totalRevenue(): number {
    return this.completedSales.reduce(
      (total, sale) => total + sale.total, 0
    );
  }

  get totalTransactions(): number {
    return this.filteredSales.filter(sale =>
      ['Completed', 'Partially Refunded', 'Refunded'].includes(sale.status)
    ).length;
  }

  get totalItemsSold(): number {
    return this.completedSales.reduce(
      (total, sale) =>
        total + Math.max(0, sale.items - sale.returnedItems), 0
    );
  }

  get refundedAmount(): number {
    return this.refundedSales.reduce(
      (total, sale) => total + sale.refundAmount, 0
    );
  }

  get refundedTransactions(): number {
    return this.refundedSales.length;
  }


  get averageSale(): number {
    return this.totalTransactions === 0
      ? 0
      : this.totalRevenue / this.totalTransactions;
  }

  get refundRate(): number {
    return this.totalTransactions === 0
      ? 0
      : (this.refundedTransactions / this.totalTransactions) * 100;
  }

  get cashSales(): number {
    return this.completedSales
      .filter(sale => sale.payment === 'Cash')
      .reduce((total, sale) => total + sale.total, 0);
  }

  get cardSales(): number {
    return this.completedSales
      .filter(sale => sale.payment === 'Card')
      .reduce((total, sale) => total + sale.total, 0);
  }

  get mobileSales(): number {
    return this.completedSales
      .filter(sale => sale.payment === 'Mobile')
      .reduce((total, sale) => total + sale.total, 0);
  }

  get cashTransactions(): number {
    return this.completedSales.filter(sale => sale.payment === 'Cash').length;
  }

  get cardTransactions(): number {
    return this.completedSales.filter(sale => sale.payment === 'Card').length;
  }

  get mobileTransactions(): number {
    return this.completedSales.filter(sale => sale.payment === 'Mobile').length;
  }

  getPaymentPercentage(amount: number): number {
    return this.totalRevenue === 0 ? 0 : (amount / this.totalRevenue) * 100;
  }

  get selectedRangeLabel(): string {
    switch (this.selectedRange) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'custom': return 'Custom Range';
      default: return 'All Time';
    }
  }

  getPaymentClass(payment: string): string {
    switch (payment) {
      case 'Cash': return 'payment-cash';
      case 'Card': return 'payment-card';
      case 'Mobile': return 'payment-mobile';
      default: return '';
    }
  }

  getStatusClass(status: string): string {
    if (status === 'Completed') return 'status-completed';
    if (status === 'Partially Refunded') return 'status-partially-refunded';
    return 'status-refunded';
  }

  trackByInvoice(index: number, sale: Sale): string {
    return sale.invoice || index.toString();
  }
}
