import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SaleApiService, SaleResponse, SaleReturnResponse } from '../../../core/services/sale-api.service';
import { PurchaseOrderApiService, PurchaseOrderResponse } from '../../../core/services/purchase-order-api.service';
import { InventoryBatchApiService, InventoryBatch } from '../../../core/services/inventory-batch-api.service';
import { TenantInventoryApiService, TenantInventoryItem } from '../../../core/services/tenant-inventory-api.service';

interface ReportStat {
  title: string;
  value: number;
  icon: string;
  route: string;
  description: string;
  type: 'currency' | 'number' | 'percentage';
}

interface SalesTrend {
  day: string;
  sales: number;
  orders: number;
}

interface TopProduct {
  name: string;
  category: string;
  quantity: number;
  revenue: number;
}

interface RecentSale {
  invoice: string;
  customer: string;
  date: string;
  amount: number;
  payment: 'Cash' | 'Card' | 'Mobile Banking';
  status: 'Paid' | 'Pending' | 'Partially Refunded' | 'Refunded';
}

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reports-dashboard.component.html',
  styleUrl: './reports-dashboard.component.scss'
})
export class ReportsDashboardComponent implements OnInit {
  private readonly saleApi = inject(SaleApiService);
  private readonly purchaseApi = inject(PurchaseOrderApiService);
  private readonly batchApi = inject(InventoryBatchApiService);
  private readonly inventoryApi = inject(TenantInventoryApiService);

  selectedPeriod = '7 Days';
  loading = false;

  reportStats: ReportStat[] = [
    {
      title: 'Total Sales', value: 0, icon: 'bi bi-cash-stack',
      route: '/app/reports/sales', description: 'Sales revenue', type: 'currency'
    },
    {
      title: 'Total Purchase', value: 0, icon: 'bi bi-cart-check',
      route: '/app/reports/purchase', description: 'Received purchase orders', type: 'currency'
    },
    {
      title: 'Gross Profit', value: 0, icon: 'bi bi-graph-up-arrow',
      route: '/app/reports/profit', description: 'Before expenses', type: 'currency'
    },
    {
      title: 'Total Orders', value: 0, icon: 'bi bi-receipt',
      route: '/app/reports/sales', description: 'Completed sales', type: 'number'
    }
  ];

  salesTrend: SalesTrend[] = [];
  topProducts: TopProduct[] = [];
  recentSales: RecentSale[] = [];

  totalSales = 0;
  totalOrders = 0;
  averageOrderValue = 0;
  totalProfitMargin = 0;
  salesRevenue = 0;
  salesCost = 0;
  grossProfit = 0;
  totalPurchase = 0;

  private sales: SaleResponse[] = [];
  private returnsBySale = new Map<number, SaleReturnResponse[]>();
  private orders: PurchaseOrderResponse[] = [];
  private batchesById = new Map<number, InventoryBatch>();
  private medicinesById = new Map<number, TenantInventoryItem>();

  ngOnInit(): void {
    this.refreshReports();
  }

  refreshReports(): void {
    const tenantId = Number(localStorage.getItem('tenantId'));

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      this.clearDashboard();
      alert('Tenant information is missing. Please log in and select your pharmacy again.');
      return;
    }

    this.loading = true;

    forkJoinDashboard(
      this.saleApi.getSales(tenantId),
      this.saleApi.listReturns(tenantId),
      this.purchaseApi.list(tenantId),
      this.batchApi.list(tenantId),
      this.inventoryApi.list(tenantId)
    ).subscribe({
      next: ({ sales, returns, orders, batches, medicines }) => {
        this.sales = Array.isArray(sales) ? sales : [];
        this.returnsBySale = new Map<number, SaleReturnResponse[]>();

        for (const record of Array.isArray(returns) ? returns : []) {
          const saleId = Number(record.saleId);
          const rows = this.returnsBySale.get(saleId) || [];
          rows.push(record);
          this.returnsBySale.set(saleId, rows);
        }

        this.orders = Array.isArray(orders) ? orders : [];

        this.batchesById = new Map(
          (Array.isArray(batches) ? batches : []).map(batch =>
            [Number(batch.id), batch] as const
          )
        );

        this.medicinesById = new Map(
          (Array.isArray(medicines) ? medicines : []).map(medicine =>
            [Number(medicine.id), medicine] as const
          )
        );

        this.rebuildDashboard();
        this.loading = false;
      },
      error: error => {
        console.error('Reports Dashboard API error:', error);
        this.clearDashboard();
        this.loading = false;
        alert('Reports Dashboard could not load data. Check your login and backend connection.');
      }
    });
  }

  onPeriodChange(): void {
    this.rebuildDashboard();
  }

  refreshDashboard(): void {
    this.refreshReports();
  }

  private rebuildDashboard(): void {
    const periodSales = this.sales.filter(sale =>
      this.isDateInPeriod(this.getDate(sale.createdAt)) &&
      this.isDisplayableSale(sale)
    );

    const completedSales = periodSales.filter(sale =>
      this.isCompletedSale(sale)
    );

    const receivedOrders = this.orders.filter(order =>
      this.isReceivedOrder(order) &&
      this.isDateInPeriod(this.getDate(order.orderDate || order.createdAt))
    );

    this.totalSales = completedSales.reduce(
      (sum, sale) => sum + this.netSaleTotal(sale), 0
    );

    this.totalOrders = completedSales.length;

    this.averageOrderValue = this.totalOrders
      ? this.totalSales / this.totalOrders
      : 0;

    this.salesRevenue = completedSales.reduce(
      (sum, sale) => sum + this.saleRevenue(sale), 0
    );

    this.salesCost = completedSales.reduce(
      (sum, sale) => sum + this.saleCost(sale), 0
    );

    this.grossProfit = this.salesRevenue - this.salesCost;

    this.totalProfitMargin = this.salesRevenue
      ? (this.grossProfit / this.salesRevenue) * 100
      : 0;

    this.totalPurchase = receivedOrders.reduce(
      (sum, order) => sum + this.number(order.totalAmount), 0
    );

    this.reportStats = this.reportStats.map(stat => ({
      ...stat,
      value:
        stat.title === 'Total Sales' ? this.totalSales :
        stat.title === 'Total Purchase' ? this.totalPurchase :
        stat.title === 'Gross Profit' ? this.grossProfit :
        stat.title === 'Total Orders' ? this.totalOrders : stat.value
    }));

    this.salesTrend = this.buildTrend(completedSales);
    this.topProducts = this.buildTopProducts(completedSales);

    this.recentSales = [...periodSales]
      .sort((a, b) => this.getDate(b.createdAt).getTime() - this.getDate(a.createdAt).getTime())
      .slice(0, 5)
      .map(sale => ({
        invoice: sale.invoiceNumber || `SALE-${sale.id}`,
        customer: sale.customerName || 'Walk-in Customer',
        date: this.formatDateTime(this.getDate(sale.createdAt)),
        amount: this.netSaleTotal(sale),
        payment: this.paymentLabel(sale.paymentMethod),
        status: this.recentSaleStatus(sale)
      }));
  }

  private clearDashboard(): void {
    this.sales = [];
    this.returnsBySale.clear();
    this.orders = [];
    this.batchesById.clear();
    this.medicinesById.clear();

    this.totalSales = 0;
    this.totalOrders = 0;
    this.averageOrderValue = 0;
    this.totalProfitMargin = 0;
    this.salesRevenue = 0;
    this.salesCost = 0;
    this.grossProfit = 0;
    this.totalPurchase = 0;

    this.salesTrend = [];
    this.topProducts = [];
    this.recentSales = [];
    this.reportStats = this.reportStats.map(stat => ({ ...stat, value: 0 }));
  }

  get maxSales(): number {
    return this.salesTrend.length
      ? Math.max(...this.salesTrend.map(item => item.sales))
      : 0;
  }

  get totalWeeklySales(): number {
    return this.salesTrend.reduce((sum, item) => sum + item.sales, 0);
  }

  get totalWeeklyOrders(): number {
    return this.salesTrend.reduce((sum, item) => sum + item.orders, 0);
  }

  getBarHeight(sales: number): number {
    return this.maxSales ? (sales / this.maxSales) * 100 : 0;
  }

  private buildTrend(sales: SaleResponse[]): SalesTrend[] {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (this.selectedPeriod === 'Today') {
      const buckets: SalesTrend[] = Array.from({ length: 8 }, (_, i) => ({
        day: `${String(i * 3).padStart(2, '0')}:00`,
        sales: 0,
        orders: 0
      }));

      sales.forEach(sale => {
        const date = this.getDate(sale.createdAt);
        if (date < today || date > now) return;

        const index = Math.min(7, Math.floor(date.getHours() / 3));
        buckets[index].sales += this.netSaleTotal(sale);
        buckets[index].orders++;
      });

      return buckets;
    }

    const days = this.selectedPeriod === '30 Days'
      ? 30
      : this.selectedPeriod === '90 Days' ? 90 : 7;

    const count = days === 7 ? 7 : 6;
    const bucketSize = Math.ceil(days / count);
    const start = new Date(today);
    start.setDate(start.getDate() - days + 1);

    const buckets: SalesTrend[] = Array.from({ length: count }, (_, i) => {
      const date = new Date(start);
      date.setDate(date.getDate() + i * bucketSize);

      return {
        day: days === 7
          ? new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
          : this.shortDate(date),
        sales: 0,
        orders: 0
      };
    });

    sales.forEach(sale => {
      const date = this.getDate(sale.createdAt);
      if (date < start || date > now) return;

      const elapsedDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
      const index = Math.min(count - 1, Math.floor(elapsedDays / bucketSize));

      if (index >= 0) {
        buckets[index].sales += this.netSaleTotal(sale);
        buckets[index].orders++;
      }
    });

    return buckets;
  }

  private buildTopProducts(sales: SaleResponse[]): TopProduct[] {
    const products = new Map<string, TopProduct>();

    sales.forEach(sale => {
      (sale.items || []).forEach(item => {
        const key = String(item.productId || item.productName || 'unknown');
        const medicine = this.medicinesById.get(Number(item.productId));
        const originalQuantity = Math.max(0, this.number(item.quantity));
        const returnedQuantity = Math.min(
          originalQuantity,
          this.returnedQuantity(
            Number(sale.id), Number(item.productId), Number(item.batchId)
          )
        );
        const quantity = Math.max(0, originalQuantity - returnedQuantity);

        if (quantity <= 0) return;

        const originalRevenue = this.number(item.subtotal) ||
          this.number(item.unitPrice) * originalQuantity;
        const revenue = originalQuantity > 0
          ? originalRevenue * quantity / originalQuantity
          : 0;

        const product = products.get(key);

        if (product) {
          product.quantity += quantity;
          product.revenue += revenue;
        } else {
          products.set(key, {
            name: item.productName || medicine?.name || 'Unknown Medicine',
            category: medicine?.category || medicine?.dosageForm || 'Medicine',
            quantity,
            revenue
          });
        }
      });
    });

    return Array.from(products.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }


  private isDateInPeriod(date: Date): boolean {
    const now = new Date();
    if (date.getTime() === 0 || date > now) return false;

    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (this.selectedPeriod === '7 Days') {
      start.setDate(start.getDate() - 6);
    } else if (this.selectedPeriod === '30 Days') {
      start.setDate(start.getDate() - 29);
    } else if (this.selectedPeriod === '90 Days') {
      start.setDate(start.getDate() - 89);
    }

    return date >= start && date <= now;
  }

  private isCompletedSale(sale: SaleResponse): boolean {
    const status = String(sale.status || '').trim().toUpperCase();
    return !status || [
      'COMPLETED', 'COMPLETE', 'PAID', 'SUCCESS',
      'PARTIALLY_REFUNDED', 'REFUNDED'
    ].includes(status);
  }

  private isDisplayableSale(sale: SaleResponse): boolean {
    const status = String(sale.status || '').trim().toUpperCase();
    return ![
      'CANCELLED', 'CANCELED', 'VOID', 'REJECTED'
    ].includes(status);
  }


  private isReceivedOrder(order: PurchaseOrderResponse): boolean {
    return ['RECEIVED', 'COMPLETED', 'COMPLETE'].includes(
      String(order.status || '').trim().toUpperCase()
    );
  }

  private saleRefundAmount(sale: SaleResponse): number {
    const grossTotal = Math.max(0, this.number(sale.total));
    const records = this.returnsBySale.get(Number(sale.id)) || [];

    const recordedRefund = records.reduce(
      (sum, record) => sum + Math.max(0, this.number(record.refundAmount)), 0
    );

    const status = String(sale.status || '').trim().toUpperCase();
    const amount = recordedRefund > 0
      ? recordedRefund
      : status === 'REFUNDED' ? grossTotal : 0;

    return Math.min(grossTotal, Math.max(0, amount));
  }

  private netSaleTotal(sale: SaleResponse): number {
    return Math.max(0, this.number(sale.total) - this.saleRefundAmount(sale));
  }

  private returnedQuantity(
    saleId: number,
    productId: number,
    batchId: number
  ): number {
    const records = this.returnsBySale.get(Number(saleId)) || [];

    return records.reduce((sum, record) => {
      const quantity = (record.items || []).reduce((itemSum, item) => {
        if (
          Number(item.productId) === Number(productId) &&
          Number(item.batchId) === Number(batchId)
        ) {
          return itemSum + Math.max(0, this.number(item.quantity));
        }
        return itemSum;
      }, 0);

      return sum + quantity;
    }, 0);
  }

  private saleRevenue(sale: SaleResponse): number {
    const subtotal = this.number(sale.subtotal);
    const discount = this.number(sale.discount);
    const tax = this.number(sale.tax);
    const total = Math.max(0, this.number(sale.total));

    const beforeDiscount = subtotal > 0
      ? subtotal
      : Math.max(0, total - tax + discount);

    const grossRevenue = Math.max(0, beforeDiscount - discount);
    const refundRatio = total > 0
      ? Math.min(1, this.saleRefundAmount(sale) / total)
      : 0;

    // Revenue excludes sales tax; refund is prorated against the sale total.
    return Math.max(0, grossRevenue * (1 - refundRatio));
  }

  private saleCost(sale: SaleResponse): number {
    let originalCost = 0;
    let missingCost = false;

    (sale.items || []).forEach(item => {
      const batch = this.batchesById.get(Number(item.batchId));

      if (!batch) {
        missingCost = true;
        return;
      }

      originalCost += this.number(item.quantity) * this.number(batch.purchasePrice);
    });

    if (missingCost) {
      console.warn(
        `Profit estimate may be incomplete for invoice ${sale.invoiceNumber}; a batch purchase price was not found.`
      );
    }

    const records = this.returnsBySale.get(Number(sale.id)) || [];
    const restockedCost = records.reduce((sum, record) =>
      sum + (record.items || []).reduce((itemSum, item) => {
        if (String(item.stockDisposition || '').trim().toUpperCase() !== 'RESTOCKED') {
          return itemSum;
        }

        const batch = this.batchesById.get(Number(item.batchId));
        if (!batch) return itemSum;

        return itemSum +
          Math.max(0, this.number(item.quantity)) *
          Math.max(0, this.number(batch.purchasePrice));
      }, 0), 0
    );

    // Quarantined items do not reverse cost until actually restocked.
    return Math.max(0, originalCost - restockedCost);
  }

  private recentSaleStatus(sale: SaleResponse): RecentSale['status'] {
    const status = String(sale.status || '').trim().toUpperCase();
    const grossTotal = Math.max(0, this.number(sale.total));
    const refund = this.saleRefundAmount(sale);

    if (
      status === 'REFUNDED' ||
      (grossTotal > 0 && refund >= grossTotal - 0.01)
    ) {
      return 'Refunded';
    }

    if (refund > 0 || status === 'PARTIALLY_REFUNDED') {
      return 'Partially Refunded';
    }

    return this.isCompletedSale(sale) ? 'Paid' : 'Pending';
  }


  private paymentLabel(value: string): RecentSale['payment'] {
    const payment = String(value || '').toUpperCase();

    if (payment === 'CARD') return 'Card';

    if (
      payment === 'MOBILE' ||
      payment.includes('BKASH') ||
      payment.includes('NAGAD')
    ) {
      return 'Mobile Banking';
    }

    return 'Cash';
  }

  private getDate(value: string | undefined): Date {
    if (!value) return new Date(0);

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

    if (match) {
      return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      );
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date(0) : date;
  }

  private number(value: unknown): number {
    if (value === null || value === undefined || value === '') return 0;

    const parsed = Number(String(value).replace(/,/g, '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private shortDate(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short'
    }).format(date);
  }
}

/*
 * Local helper keeps the four API calls together for this standalone dashboard.
 */
import { Observable, forkJoin } from 'rxjs';

function forkJoinDashboard(
  sales: Observable<SaleResponse[]>,
  returns: Observable<SaleReturnResponse[]>,
  orders: Observable<PurchaseOrderResponse[]>,
  batches: Observable<InventoryBatch[]>,
  medicines: Observable<TenantInventoryItem[]>
) {
  return forkJoin({ sales, returns, orders, batches, medicines });
}
