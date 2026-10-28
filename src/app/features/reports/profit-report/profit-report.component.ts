import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import {
  SaleApiService,
  SaleResponse,
  SaleReturnResponse
} from '../../../core/services/sale-api.service';

import {
  PurchaseOrderApiService,
  PurchaseOrderResponse
} from '../../../core/services/purchase-order-api.service';

import {
  InventoryBatchApiService,
  InventoryBatch
} from '../../../core/services/inventory-batch-api.service';

interface ProfitTransaction {
  date: Date;
  reference: string;
  type: 'Sale' | 'Purchase';
  party: string;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

@Component({
  selector: 'app-profit-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profit-report.component.html',
  styleUrl: './profit-report.component.scss'
})
export class ProfitReportComponent implements OnInit {
  private readonly saleApi = inject(SaleApiService);
  private readonly purchaseOrderApi = inject(PurchaseOrderApiService);
  private readonly batchApi = inject(InventoryBatchApiService);

  private transactions: ProfitTransaction[] = [];

  selectedPeriod = 'all';
  customFrom = '';
  customTo = '';
  searchTerm = '';

  loading = false;

  ngOnInit(): void {
    this.refreshReport();
  }

  refreshReport(): void {
    const tenantId = Number(localStorage.getItem('tenantId'));

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      this.transactions = [];
      console.error('Profit Report: valid tenantId was not found.');
      alert('Tenant information is missing. Please log in and select your pharmacy again.');
      return;
    }

    this.loading = true;

    forkJoin({
      sales: this.saleApi.getSales(tenantId),
      returns: this.saleApi.listReturns(tenantId),
      orders: this.purchaseOrderApi.list(tenantId),
      batches: this.batchApi.list(tenantId)
    }).subscribe({
      next: ({ sales, returns, orders, batches }) => {
        const batchById = new Map<number, InventoryBatch>(
          (Array.isArray(batches) ? batches : [])
            .map(batch => [Number(batch.id), batch])
        );

        const returnsBySale = new Map<number, SaleReturnResponse[]>();

        for (const record of Array.isArray(returns) ? returns : []) {
          const saleId = Number(record.saleId);
          const rows = returnsBySale.get(saleId) || [];
          rows.push(record);
          returnsBySale.set(saleId, rows);
        }

        const saleTransactions = (Array.isArray(sales) ? sales : [])
          .filter(sale => this.isReportableSale(sale))
          .map(sale => this.mapSale(
            sale, batchById, returnsBySale.get(Number(sale.id)) || []
          ));

        const purchaseTransactions = (Array.isArray(orders) ? orders : [])
          .filter(order => this.isReceivedOrder(order))
          .map(order => this.mapPurchase(order));

        this.transactions = [
          ...saleTransactions,
          ...purchaseTransactions
        ].sort((a, b) => b.date.getTime() - a.date.getTime());

        this.loading = false;
      },
      error: error => {
        console.error('Unable to load Profit Report from backend:', error);
        this.transactions = [];
        this.loading = false;
        alert('Profit Report could not be loaded. Check your login and backend connection.');
      }
    });
  }

  private isReportableSale(sale: SaleResponse): boolean {
    const status = String(sale.status || '').trim().toUpperCase();

    // Include refunded sales so their net revenue is represented as zero
    // (or the remaining amount for a partial refund).
    return !status || [
      'COMPLETED', 'COMPLETE', 'PAID', 'SUCCESS',
      'PARTIALLY_REFUNDED', 'REFUNDED'
    ].includes(status);
  }


  private isReceivedOrder(order: PurchaseOrderResponse): boolean {
    const status = String(order.status || '').trim().toUpperCase();
    return ['RECEIVED', 'COMPLETED', 'COMPLETE'].includes(status);
  }

  private mapSale(
    sale: SaleResponse,
    batchById: Map<number, InventoryBatch>,
    returns: SaleReturnResponse[]
  ): ProfitTransaction {
    let missingBatchCost = false;

    const originalCost = (sale.items || []).reduce((sum, item) => {
      const batch = batchById.get(Number(item.batchId));

      if (!batch) {
        missingBatchCost = true;
        return sum;
      }

      return sum
        + this.toNumber(item.quantity) * this.toNumber(batch.purchasePrice);
    }, 0);

    if (missingBatchCost) {
      console.warn(
        `Profit Report: a batch purchase cost was unavailable for invoice ${sale.invoiceNumber}. Profit may be inaccurate.`
      );
    }

    const subtotal = this.toNumber(sale.subtotal);
    const discount = this.toNumber(sale.discount);
    const tax = this.toNumber(sale.tax);
    const total = Math.max(0, this.toNumber(sale.total));

    // Base revenue excludes tax and subtracts the sale discount.
    const baseRevenue = Math.max(
      0,
      (subtotal > 0 ? subtotal : Math.max(0, total - tax + discount)) - discount
    );

    const returnedAmount = (returns || []).reduce(
      (sum, record) => sum + Math.max(0, this.toNumber(record.refundAmount)), 0
    );

    const status = String(sale.status || '').trim().toUpperCase();
    const effectiveRefund = Math.min(
      total,
      returnedAmount > 0 ? returnedAmount :
        status === 'REFUNDED' ? total : 0
    );

    // Refunds include the transaction's tax proportion. Scale the net-of-tax
    // revenue by the fraction of the sale amount actually refunded.
    const refundRatio = total > 0 ? effectiveRefund / total : 0;
    const revenue = Math.max(0, baseRevenue * (1 - refundRatio));

    // Only stock explicitly marked RESTOCKED reverses this report's COGS.
    // Quarantined goods remain excluded until staff accepts them back.
    const restockedCost = (returns || []).reduce((sum, record) =>
      sum + (record.items || []).reduce((itemSum, item) => {
        if (String(item.stockDisposition || '').toUpperCase() !== 'RESTOCKED') {
          return itemSum;
        }

        const batch = batchById.get(Number(item.batchId));
        if (!batch) return itemSum;

        return itemSum
          + Math.max(0, this.toNumber(item.quantity))
          * Math.max(0, this.toNumber(batch.purchasePrice));
      }, 0), 0
    );

    const cost = Math.max(0, originalCost - restockedCost);
    const profit = revenue - cost;

    return {
      date: this.getDate(sale.createdAt),
      reference: sale.invoiceNumber || `SALE-${sale.id}`,
      type: 'Sale',
      party: sale.customerName || 'Walk-in Customer',
      revenue,
      cost,
      profit,
      margin: revenue > 0 ? (profit / revenue) * 100 : 0
    };
  }


  private mapPurchase(order: PurchaseOrderResponse): ProfitTransaction {
    const cost = this.toNumber(order.totalAmount);

    return {
      date: this.getDate(order.orderDate || order.createdAt),
      reference: order.orderNumber || `PO-${order.id}`,
      type: 'Purchase',
      party: order.supplierName || 'Supplier not recorded',
      revenue: 0,
      cost,
      profit: -cost,
      margin: 0
    };
  }

  private get periodTransactions(): ProfitTransaction[] {
    return this.transactions.filter(transaction =>
      this.isInSelectedPeriod(transaction.date)
    );
  }

  get filteredTransactions(): ProfitTransaction[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.periodTransactions.filter(transaction =>
      !search ||
      transaction.reference.toLowerCase().includes(search) ||
      transaction.party.toLowerCase().includes(search) ||
      transaction.type.toLowerCase().includes(search)
    );
  }

  private get salesTransactions(): ProfitTransaction[] {
    return this.periodTransactions.filter(
      transaction => transaction.type === 'Sale'
    );
  }

  private get purchaseTransactions(): ProfitTransaction[] {
    return this.periodTransactions.filter(
      transaction => transaction.type === 'Purchase'
    );
  }

  get salesRevenue(): number {
    return this.salesTransactions.reduce(
      (total, transaction) => total + transaction.revenue, 0
    );
  }

  get totalRevenue(): number {
    return this.salesRevenue;
  }

  get salesCost(): number {
    return this.salesTransactions.reduce(
      (total, transaction) => total + transaction.cost, 0
    );
  }

  get salesProfit(): number {
    return this.salesRevenue - this.salesCost;
  }

  get grossProfit(): number {
    return this.salesProfit;
  }

  get profitMargin(): number {
    return this.salesRevenue > 0
      ? (this.grossProfit / this.salesRevenue) * 100
      : 0;
  }

  get totalSales(): number {
    return this.salesTransactions.length;
  }

  get purchaseCost(): number {
    return this.purchaseTransactions.reduce(
      (total, transaction) => total + transaction.cost, 0
    );
  }

  get totalPurchases(): number {
    return this.purchaseTransactions.length;
  }

  onPeriodChange(): void {
    // The period-based getters recalculate when the selection changes.
  }

  applySearch(): void {
    // The filteredTransactions getter applies the current search term.
  }

  private isInSelectedPeriod(date: Date): boolean {
    const now = new Date();

    let from: Date | null = null;
    let to: Date | null = null;

    switch (this.selectedPeriod) {
      case 'today':
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to = new Date(
          now.getFullYear(), now.getMonth(), now.getDate(),
          23, 59, 59, 999
        );
        break;

      case 'week': {
        from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const day = from.getDay();
        from.setDate(from.getDate() - (day === 0 ? 6 : day - 1));
        to = new Date(
          now.getFullYear(), now.getMonth(), now.getDate(),
          23, 59, 59, 999
        );
        break;
      }

      case 'month':
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(
          now.getFullYear(), now.getMonth(), now.getDate(),
          23, 59, 59, 999
        );
        break;

      case 'custom':
        from = this.customFrom
          ? new Date(`${this.customFrom}T00:00:00`)
          : null;
        to = this.customTo
          ? new Date(`${this.customTo}T23:59:59.999`)
          : null;

        if (
          (from && Number.isNaN(from.getTime())) ||
          (to && Number.isNaN(to.getTime())) ||
          (from && to && from > to)
        ) {
          return false;
        }
        break;

      case 'all':
      default:
        return true;
    }

    return (!from || date >= from) && (!to || date <= to);
  }

  private getDate(value: string | undefined): Date {
    if (!value) {
      return new Date(0);
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
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
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  getProfitClass(profit: number): string {
    if (profit > 0) {
      return 'positive';
    }

    if (profit < 0) {
      return 'negative';
    }

    return 'neutral';
  }

  getMarginClass(margin: number): string {
    if (margin >= 20) {
      return 'high';
    }

    if (margin >= 10) {
      return 'medium';
    }

    return 'low';
  }

  exportCSV(): void {
    if (!this.filteredTransactions.length) {
      return;
    }

    const headers = [
      'Date', 'Reference', 'Type', 'Party',
      'Revenue', 'Cost', 'Profit', 'Margin'
    ];

    const rows = this.filteredTransactions.map(transaction => [
      this.formatDate(transaction.date),
      transaction.reference,
      transaction.type,
      transaction.party,
      transaction.revenue.toFixed(2),
      transaction.cost.toFixed(2),
      transaction.profit.toFixed(2),
      `${transaction.margin.toFixed(2)}%`
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
    link.download = `profit-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }
}
