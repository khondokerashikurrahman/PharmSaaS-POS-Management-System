import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import {
  SaleApiService,
  SaleResponse,
  SaleReturnResponse
} from '../../../core/services/sale-api.service';

interface CashierPerformance {
  cashier: string;
  transactions: number;
  itemsSold: number;
  totalSales: number;
  refundAmount: number;
  averageSale: number;
  cash: number;
  card: number;
  mobile: number;
  credit: number;
}

type SaleWithCashier = SaleResponse & {
  cashierId?: number | string | null;
  cashierName?: string | null;
  cashier?: string | { id?: number | string; name?: string } | null;
  createdByName?: string | null;
  userName?: string | null;
  user?: { id?: number | string; name?: string } | null;
  cashierInfo?: { id?: number | string; name?: string } | null;
};

@Component({
  selector: 'app-cashier-performance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cashier-performance.component.html',
  styleUrl: './cashier-performance.component.scss'
})
export class CashierPerformanceComponent implements OnInit {
  private readonly saleApi = inject(SaleApiService);
  private returnsBySale = new Map<number, SaleReturnResponse[]>();

  selectedPeriod: 'today' | 'week' | 'month' | 'all' | 'custom' = 'month';

  customFrom = '';
  customTo = '';
  searchTerm = '';

  cashiers: CashierPerformance[] = [];
  filteredCashiers: CashierPerformance[] = [];

  totalTransactions = 0;
  totalItemsSold = 0;
  totalSales = 0;
  totalRefunded = 0;
  averageSale = 0;

  totalCash = 0;
  totalCard = 0;
  totalMobile = 0;
  totalCredit = 0;

  topCashier: CashierPerformance | null = null;
  loading = false;

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    const tenantId = Number(localStorage.getItem('tenantId'));

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      this.resetReport();
      alert('Tenant information is missing. Please log in and select your pharmacy again.');
      return;
    }

    this.loading = true;

    forkJoin({
      sales: this.saleApi.getSales(tenantId),
      returns: this.saleApi.listReturns(tenantId)
    }).subscribe({
      next: ({ sales, returns }) => {
        this.returnsBySale = new Map<number, SaleReturnResponse[]>();

        for (const record of Array.isArray(returns) ? returns : []) {
          const saleId = Number(record.saleId);
          const rows = this.returnsBySale.get(saleId) || [];
          rows.push(record);
          this.returnsBySale.set(saleId, rows);
        }

        const reportableSales = (Array.isArray(sales) ? sales : [])
          .filter(sale => this.isReportableSale(sale))
          .filter(sale => this.isWithinSelectedPeriod(this.getSaleDate(sale)));

        this.cashiers = this.buildCashierPerformance(reportableSales);
        this.calculateSummary();
        this.applySearch();
        this.loading = false;
      },
      error: error => {
        console.error('Failed to load performance/refund data:', error);
        this.resetReport();
        this.loading = false;
        alert('Performance Report could not be loaded. Please check your login and backend connection.');
      }
    });
  }

  private resetReport(): void {
    this.returnsBySale.clear();
    this.cashiers = [];
    this.filteredCashiers = [];
    this.totalTransactions = 0;
    this.totalItemsSold = 0;
    this.totalSales = 0;
    this.totalRefunded = 0;
    this.averageSale = 0;
    this.totalCash = 0;
    this.totalCard = 0;
    this.totalMobile = 0;
    this.totalCredit = 0;
    this.topCashier = null;
  }

  private isReportableSale(sale: SaleResponse): boolean {
    const status = String(sale.status || '').trim().toUpperCase();
    return [
      'COMPLETED', 'COMPLETE', 'PAID', 'SUCCESS',
      'PARTIALLY_REFUNDED', 'REFUNDED'
    ].includes(status);
  }

  private getRefundAmount(sale: SaleResponse): number {
    const gross = Math.max(0, this.toNumber(sale.total));
    const records = this.returnsBySale.get(Number(sale.id)) || [];
    const recorded = records.reduce(
      (sum, record) => sum + Math.max(0, this.toNumber(record.refundAmount)), 0
    );
    const status = String(sale.status || '').trim().toUpperCase();
    const refund = recorded > 0 ? recorded :
      status === 'REFUNDED' ? gross : 0;

    return Math.min(gross, refund);
  }

  private netSaleAmount(sale: SaleResponse): number {
    return Math.max(0, this.toNumber(sale.total) - this.getRefundAmount(sale));
  }

  private netItemsSold(sale: SaleResponse): number {
    const original = (sale.items || []).reduce(
      (sum, item) => sum + Math.max(0, this.toNumber(item.quantity)), 0
    );
    const records = this.returnsBySale.get(Number(sale.id)) || [];
    const returned = records.reduce(
      (sum, record) => sum + (record.items || []).reduce(
        (itemSum, item) => itemSum + Math.max(0, this.toNumber(item.quantity)), 0
      ), 0
    );

    return Math.max(0, original - returned);
  }

  private buildCashierPerformance(sales: SaleResponse[]): CashierPerformance[] {
    const cashierMap = new Map<string, CashierPerformance>();

    sales.forEach(rawSale => {
      const sale = rawSale as SaleWithCashier;
      const identity = this.getCashierIdentity(sale);
      const amount = this.netSaleAmount(sale);
      const itemsSold = this.netItemsSold(sale);
      const payment = this.getPaymentMethod(sale.paymentMethod);

      if (!cashierMap.has(identity.key)) {
        cashierMap.set(identity.key, {
          cashier: identity.name,
          transactions: 0,
          itemsSold: 0,
          totalSales: 0,
          refundAmount: 0,
          averageSale: 0,
          cash: 0,
          card: 0,
          mobile: 0,
          credit: 0
        });
      }

      const record = cashierMap.get(identity.key)!;

      record.transactions += 1;
      record.itemsSold += itemsSold;
      record.totalSales += amount;
      record.refundAmount += this.getRefundAmount(sale);

      switch (payment) {
        case 'cash':
          record.cash += amount;
          break;
        case 'card':
          record.card += amount;
          break;
        case 'mobile':
          record.mobile += amount;
          break;
        case 'credit':
          record.credit += amount;
          break;
        // Do not classify an unknown payment method as Cash.
      }
    });

    const result = Array.from(cashierMap.values());

    result.forEach(cashier => {
      cashier.averageSale = cashier.transactions
        ? cashier.totalSales / cashier.transactions
        : 0;
    });

    return result.sort((a, b) => b.totalSales - a.totalSales);
  }

  private getCashierIdentity(sale: SaleWithCashier): {
    key: string;
    name: string;
  } {
    const cashierObject =
      sale.cashier && typeof sale.cashier === 'object'
        ? sale.cashier
        : null;

    const id =
      sale.cashierId
      ?? sale.cashierInfo?.id
      ?? cashierObject?.id
      ?? sale.user?.id;

    const name =
      sale.cashierName
      ?? sale.cashierInfo?.name
      ?? cashierObject?.name
      ?? (typeof sale.cashier === 'string' ? sale.cashier : null)
      ?? sale.createdByName
      ?? sale.userName
      ?? sale.user?.name;

    const hasName = Boolean(String(name ?? '').trim());

    const displayName = hasName
      ? String(name).trim()
      : id != null
        ? `Cashier ID ${id}`
        : 'Unknown Cashier';

    const key = id != null
      ? `id:${id}`
      : hasName
        ? `name:${displayName.toLowerCase()}`
        : 'unknown-cashier';

    return { key, name: displayName };
  }

  private calculateSummary(): void {
    this.totalTransactions = 0;
    this.totalItemsSold = 0;
    this.totalSales = 0;
    this.totalRefunded = 0;
    this.totalCash = 0;
    this.totalCard = 0;
    this.totalMobile = 0;
    this.totalCredit = 0;

    this.cashiers.forEach(cashier => {
      this.totalTransactions += cashier.transactions;
      this.totalItemsSold += cashier.itemsSold;
      this.totalSales += cashier.totalSales;
      this.totalRefunded += cashier.refundAmount;
      this.totalCash += cashier.cash;
      this.totalCard += cashier.card;
      this.totalMobile += cashier.mobile;
      this.totalCredit += cashier.credit;
    });

    this.averageSale = this.totalTransactions
      ? this.totalSales / this.totalTransactions
      : 0;

    this.topCashier = this.cashiers.length ? this.cashiers[0] : null;
  }

  getTotalCash(): number {
    return this.totalCash;
  }

  getTotalCard(): number {
    return this.totalCard;
  }

  getTotalMobile(): number {
    return this.totalMobile;
  }

  getTotalCredit(): number {
    return this.totalCredit;
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredCashiers = !term
      ? [...this.cashiers]
      : this.cashiers.filter(cashier =>
          cashier.cashier.toLowerCase().includes(term)
        );
  }

  onPeriodChange(): void {
    this.loadReport();
  }

  refreshReport(): void {
    this.loadReport();
  }

  private getSaleDate(sale: SaleResponse): Date {
    if (!sale.createdAt) {
      return new Date(0);
    }

    const date = new Date(sale.createdAt);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
  }

  private isWithinSelectedPeriod(date: Date): boolean {
    if (date.getTime() === 0) {
      return false;
    }

    if (this.selectedPeriod === 'all') {
      return date <= new Date();
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(
      now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999
    );

    switch (this.selectedPeriod) {
      case 'today':
        return date >= start && date <= end;

      case 'week': {
        const day = start.getDay();
        start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
        return date >= start && date <= end;
      }

      case 'month':
        start.setDate(1);
        return date >= start && date <= end;

      case 'custom': {
        const from = this.customFrom
          ? new Date(`${this.customFrom}T00:00:00`)
          : null;
        const to = this.customTo
          ? new Date(`${this.customTo}T23:59:59.999`)
          : null;

        if (
          (from && Number.isNaN(from.getTime())) ||
          (to && Number.isNaN(to.getTime())) ||
          (from && to && from > to)
        ) {
          return false;
        }

        return (!from || date >= from) && (!to || date <= to);
      }

      default:
        return true;
    }
  }

  private getPaymentMethod(
    value: string
  ): 'cash' | 'card' | 'mobile' | 'credit' | 'unknown' {
    const method = String(value || '').trim().toLowerCase();

    if (method === 'cash') return 'cash';
    if (method === 'card' || method.includes('debit')) return 'card';

    if (
      method.includes('mobile') ||
      method.includes('bkash') ||
      method.includes('nagad') ||
      method.includes('rocket') ||
      method === 'mfs'
    ) {
      return 'mobile';
    }

    if (method.includes('credit') || method.includes('due')) {
      return 'credit';
    }

    return 'unknown';
  }

  private toNumber(value: unknown): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    const parsed = Number(
      String(value).replace(/,/g, '').replace(/[^\d.-]/g, '')
    );

    return Number.isFinite(parsed) ? parsed : 0;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  exportCSV(): void {
    const headers = [
      'Cashier',
      'Transactions',
      'Items Sold',
      'Total Sales',
      'Average Sale',
      'Cash',
      'Card',
      'Mobile',
      'Credit'
    ];

    const rows = this.filteredCashiers.map(cashier => [
      cashier.cashier,
      cashier.transactions,
      cashier.itemsSold,
      cashier.totalSales.toFixed(2),
      cashier.averageSale.toFixed(2),
      cashier.cash.toFixed(2),
      cashier.card.toFixed(2),
      cashier.mobile.toFixed(2),
      cashier.credit.toFixed(2)
    ]);

    const csv = [headers, ...rows]
      .map(row =>
        row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `cashier-performance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }
}
