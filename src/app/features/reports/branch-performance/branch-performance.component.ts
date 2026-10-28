import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import {
  SaleApiService,
  SaleResponse,
  SaleReturnResponse
} from '../../../core/services/sale-api.service';

interface BranchPerformance {
  branch: string;
  code: string;
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

type SaleWithBranch = SaleResponse & {
  storeId?: number | null;
  storeName?: string | null;
  storeCode?: string | null;
  branchId?: number | null;
  branchName?: string | null;
  branchCode?: string | null;
  branch?: string | {
    id?: number;
    name?: string;
    code?: string;
  } | null;
  branchInfo?: {
    id?: number;
    name?: string;
    code?: string;
  } | null;
  locationName?: string | null;
};

@Component({
  selector: 'app-branch-performance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './branch-performance.component.html',
  styleUrl: './branch-performance.component.scss'
})
export class BranchPerformanceComponent implements OnInit {
  private readonly saleApi = inject(SaleApiService);
  private returnsBySale = new Map<number, SaleReturnResponse[]>();

  selectedPeriod: 'today' | 'week' | 'month' | 'all' | 'custom' = 'month';

  customFrom = '';
  customTo = '';
  searchTerm = '';

  branches: BranchPerformance[] = [];
  filteredBranches: BranchPerformance[] = [];

  totalTransactions = 0;
  totalItemsSold = 0;
  totalSales = 0;
  totalRefunded = 0;
  averageSale = 0;

  totalCash = 0;
  totalCard = 0;
  totalMobile = 0;
  totalCredit = 0;

  topBranch: BranchPerformance | null = null;
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

        this.branches = this.buildBranchPerformance(reportableSales);
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
    this.branches = [];
    this.filteredBranches = [];
    this.totalTransactions = 0;
    this.totalItemsSold = 0;
    this.totalSales = 0;
    this.totalRefunded = 0;
    this.averageSale = 0;
    this.totalCash = 0;
    this.totalCard = 0;
    this.totalMobile = 0;
    this.totalCredit = 0;
    this.topBranch = null;
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

  private buildBranchPerformance(sales: SaleResponse[]): BranchPerformance[] {
    const branchMap = new Map<string, BranchPerformance>();

    for (const rawSale of sales) {
      const sale = rawSale as SaleWithBranch;
      const branchInfo = this.getBranchInfo(sale);
      const key = branchInfo.key;
      const amount = this.netSaleAmount(sale);
      const items = this.netItemsSold(sale);
      const payment = this.getPaymentMethod(sale.paymentMethod);

      if (!branchMap.has(key)) {
        branchMap.set(key, {
          branch: branchInfo.name,
          code: branchInfo.code,
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

      const record = branchMap.get(key)!;
      record.transactions += 1;
      record.itemsSold += items;
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
      }
    }

    const result = Array.from(branchMap.values());

    result.forEach(branch => {
      branch.averageSale = branch.transactions
        ? branch.totalSales / branch.transactions
        : 0;
    });

    return result.sort((a, b) => b.totalSales - a.totalSales);
  }

  private getBranchInfo(sale: SaleWithBranch): {
    key: string;
    name: string;
    code: string;
  } {
    const branchObject =
      sale.branch && typeof sale.branch === 'object'
        ? sale.branch
        : null;

    // This backend currently records a Store on each sale.
    // Prefer the actual Store fields; retain branch-field fallbacks
    // for compatibility with older or alternate API responses.
    const branchId = sale.storeId
      ?? sale.branchId
      ?? sale.branchInfo?.id
      ?? branchObject?.id;

    const rawName =
      sale.storeName
      ?? sale.branchName
      ?? sale.branchInfo?.name
      ?? branchObject?.name
      ?? (typeof sale.branch === 'string' ? sale.branch : null)
      ?? sale.locationName;

    const rawCode =
      sale.storeCode
      ?? sale.branchCode
      ?? sale.branchInfo?.code
      ?? branchObject?.code;

    const hasName = Boolean(String(rawName ?? '').trim());
    const name = hasName
      ? String(rawName).trim()
      : branchId != null
        ? `Branch ID ${branchId}`
        : 'Branch not recorded';

    const code = String(rawCode ?? '').trim()
      || (branchId != null ? `ID-${branchId}` : 'N/A');

    // Use an explicit branch ID when available to avoid merging branches
    // that happen to have similar names.
    const key = branchId != null
      ? `id:${branchId}`
      : hasName
        ? `name:${name.toLowerCase()}`
        : 'branch-not-recorded';

    return { key, name, code };
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

    for (const branch of this.branches) {
      this.totalTransactions += branch.transactions;
      this.totalItemsSold += branch.itemsSold;
      this.totalSales += branch.totalSales;
      this.totalRefunded += branch.refundAmount;
      this.totalCash += branch.cash;
      this.totalCard += branch.card;
      this.totalMobile += branch.mobile;
      this.totalCredit += branch.credit;
    }

    this.averageSale = this.totalTransactions
      ? this.totalSales / this.totalTransactions
      : 0;

    this.topBranch = this.branches.length ? this.branches[0] : null;
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

    this.filteredBranches = !term
      ? [...this.branches]
      : this.branches.filter(branch =>
          branch.branch.toLowerCase().includes(term)
          || branch.code.toLowerCase().includes(term)
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
          (from && Number.isNaN(from.getTime()))
          || (to && Number.isNaN(to.getTime()))
          || (from && to && from > to)
        ) {
          return false;
        }

        return (!from || date >= from) && (!to || date <= to);
      }

      case 'all':
      default:
        return date <= end;
    }
  }

  private getPaymentMethod(
    value: string
  ): 'cash' | 'card' | 'mobile' | 'credit' | 'unknown' {
    const method = String(value || '').trim().toLowerCase();

    if (method === 'cash') return 'cash';
    if (method === 'card' || method.includes('debit')) return 'card';

    if (
      method.includes('mobile')
      || method.includes('bkash')
      || method.includes('nagad')
      || method.includes('rocket')
      || method === 'mfs'
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

    const number = Number(
      String(value).replace(/,/g, '').replace(/[^\d.-]/g, '')
    );

    return Number.isFinite(number) ? number : 0;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  }

  exportCSV(): void {
    const headers = [
      'Branch', 'Branch Code', 'Transactions', 'Items Sold',
      'Total Sales', 'Average Sale', 'Cash', 'Card', 'Mobile', 'Credit'
    ];

    const rows = this.filteredBranches.map(branch => [
      branch.branch,
      branch.code,
      branch.transactions,
      branch.itemsSold,
      branch.totalSales.toFixed(2),
      branch.averageSale.toFixed(2),
      branch.cash.toFixed(2),
      branch.card.toFixed(2),
      branch.mobile.toFixed(2),
      branch.credit.toFixed(2)
    ]);

    const csv = [headers, ...rows]
      .map(row => row
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
    link.download = `branch-performance-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }
}
