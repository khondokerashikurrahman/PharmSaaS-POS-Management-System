
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SaleApiService, SaleResponse, SaleReturnCreateRequest } from '../../../core/services/sale-api.service';
import { ReturnSaleComponent, ReturnSaleData } from '../return-sale/return-sale.component';

import {
  InvoiceReceiptComponent,
  InvoiceReceiptData
} from '../invoice-receipt/invoice-receipt.component';

interface PosSaleItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  company?: string;
  generic?: string;
  batchId: string;
  batchNumber: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface PosSale {
  id: number;
  invoice: string;
  date: string;
  timestamp: number;
  customer: string;
  items: number;
  saleItems: PosSaleItem[];
  payment: 'Cash' | 'Card' | 'Mobile';
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountReceived: number;
  change: number;
  status: 'Completed' | 'Partially Refunded' | 'Refunded';
}

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InvoiceReceiptComponent,
    ReturnSaleComponent
  ],
  templateUrl: './sales-history.component.html',
  styleUrl: './sales-history.component.scss'
})
export class SalesHistoryComponent implements OnInit {

  sales: PosSale[] = [];

  searchTerm = '';
  paymentFilter = 'All';
  statusFilter = 'All';

  selectedSale: PosSale | null = null;

  showInvoiceReceipt = false;

  showReturnModal = false;
  returnTarget: PosSale | null = null;
  processingReturn = false;

  private pendingRefundRequestKey: string | null = null;
  private pendingRefundSignature = '';

  constructor(private saleApiService: SaleApiService) {}

  ngOnInit(): void {
    this.loadSales();
  }

  // =========================
  // LOAD SALES
  // =========================

  loadSales(): void {
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

    if (!Number.isSafeInteger(tenantId) || tenantId <= 0) {
      this.sales = [];
      alert('Tenant ID পাওয়া যায়নি। আবার login করুন।');
      return;
    }

    this.saleApiService.getSales(tenantId).subscribe({
      next: records => {
        this.sales = records.map(sale => {
          const created = sale.createdAt ? new Date(sale.createdAt) : null;
          const timestamp =
            created && !Number.isNaN(created.getTime())
              ? created.getTime()
              : 0;

          const paymentCode = (sale.paymentMethod || '').toUpperCase();
          const payment: PosSale['payment'] =
            paymentCode === 'CARD'
              ? 'Card'
              : paymentCode === 'MOBILE'
                ? 'Mobile'
                : 'Cash';

          const statusCode = String(sale.status || '').toUpperCase();
          const status: PosSale['status'] =
            statusCode === 'REFUNDED'
              ? 'Refunded'
              : statusCode === 'PARTIALLY_REFUNDED'
                ? 'Partially Refunded'
                : 'Completed';

          return {
            id: sale.id,
            invoice: sale.invoiceNumber || `SALE-${sale.id}`,
            date: created && timestamp
              ? created.toLocaleString('en-GB')
              : '—',
            timestamp,
            customer: sale.customerName || 'Walk-in Customer',
            items: (sale.items || []).reduce(
              (sum, item) => sum + Number(item.quantity || 0), 0
            ),
            saleItems: (sale.items || []).map((item, index) => ({
              id: `${sale.id}-${index}`,
              productId: String(item.productId),
              name: item.productName || 'Unknown medicine',
              sku: item.sku || '',
              batchId: String(item.batchId),
              batchNumber: item.batchNumber || 'N/A',
              quantity: Number(item.quantity || 0),
              price: Number(item.unitPrice || 0),
              subtotal: Number(item.subtotal || 0)
            })),
            payment,
            subtotal: Number(sale.subtotal || 0),
            discount: Number(sale.discount || 0),
            tax: Number(sale.tax || 0),
            total: Number(sale.total || 0),
            amountReceived: Number(sale.amountReceived || 0),
            change: Number(sale.changeAmount || 0),
            status
          };
        });
      },
      error: error => {
        console.error('Failed to load sales from backend', error);
        this.sales = [];
        alert(
          error?.error?.message ||
          'Sales History load হয়নি। Backend connection ও login যাচাই করুন।'
        );
      }
    });
  }

  // =========================
  // FILTERED SALES
  // =========================

  get filteredSales(): PosSale[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.sales.filter(sale => {

      const matchesSearch =
        !term ||
        sale.invoice.toLowerCase().includes(term) ||
        sale.customer.toLowerCase().includes(term);

      const matchesPayment =
        this.paymentFilter === 'All' ||
        sale.payment === this.paymentFilter;

      const matchesStatus =
        this.statusFilter === 'All' ||
        sale.status === this.statusFilter;

      return (
        matchesSearch &&
        matchesPayment &&
        matchesStatus
      );
    });
  }

  // =========================
  // STATISTICS
  // =========================

  get totalSales(): number {
    return this.sales.length;
  }

  get completedSales(): number {
    return this.sales.filter(
      sale => sale.status === 'Completed'
    ).length;
  }

  get totalRevenue(): number {
    return this.sales
      .filter(sale => sale.status === 'Completed')
      .reduce(
        (sum, sale) => sum + sale.total,
        0
      );
  }

  get todaySales(): number {
    const today = new Date();

    return this.sales.filter(sale => {

      const saleDate = new Date(
        sale.timestamp
      );

      return (
        saleDate.getDate() === today.getDate() &&
        saleDate.getMonth() === today.getMonth() &&
        saleDate.getFullYear() === today.getFullYear()
      );
    }).length;
  }

  get todayRevenue(): number {
    const today = new Date();

    return this.sales
      .filter(sale => {

        const saleDate = new Date(
          sale.timestamp
        );

        return (
          saleDate.getDate() === today.getDate() &&
          saleDate.getMonth() === today.getMonth() &&
          saleDate.getFullYear() === today.getFullYear() &&
          sale.status === 'Completed'
        );
      })
      .reduce(
        (sum, sale) => sum + sale.total,
        0
      );
  }

  // =========================
  // FILTER ACTIONS
  // =========================

  clearFilters(): void {
    this.searchTerm = '';
    this.paymentFilter = 'All';
    this.statusFilter = 'All';
  }

  // =========================
  // SALE DETAILS
  // =========================

  viewSaleDetails(sale: PosSale): void {
    this.selectedSale = sale;
  }

  closeSaleDetails(): void {
    this.selectedSale = null;
  }

  // =========================
  // INVOICE
  // =========================

  viewInvoice(sale: PosSale): void {
    this.selectedSale = sale;
    this.showInvoiceReceipt = true;
  }

  closeInvoice(): void {
    this.showInvoiceReceipt = false;
    this.selectedSale = null;
  }

  getReceiptData(
    sale: PosSale
  ): InvoiceReceiptData {

    return {
      invoiceNumber: sale.invoice,
      date: sale.date,

      customerName: sale.customer,

      items: sale.saleItems.map(item => ({
        productName: item.name,
        sku: item.sku,
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.subtotal
      })),

      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,

      totalAmount: sale.total,

      paymentMethod: sale.payment,

      amountReceived: sale.amountReceived,

      change: sale.change
    };
  }

  // =========================
  // REFUND SALE
  // =========================

  refundSale(sale: PosSale): void {
    if (sale.status === 'Refunded') {
      alert('This sale has already been fully refunded.');
      return;
    }

    this.returnTarget = sale;
    this.showReturnModal = true;
    this.pendingRefundRequestKey = null;
    this.pendingRefundSignature = '';
  }

  closeReturnModal(): void {
    if (this.processingReturn) {
      return;
    }

    this.showReturnModal = false;
    this.returnTarget = null;
    this.pendingRefundRequestKey = null;
    this.pendingRefundSignature = '';
  }

  completeReturn(data: ReturnSaleData): void {
    const sale = this.returnTarget;

    if (!sale || this.processingReturn) {
      return;
    }

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

    if (!Number.isSafeInteger(tenantId) || tenantId <= 0) {
      alert('Tenant information is missing. Please log in again.');
      return;
    }

    const items = data.items
      .map(item => ({
        batchId: Number(item.batchId),
        quantity: Number(item.returnQuantity)
      }))
      .filter(item =>
        Number.isSafeInteger(item.batchId) &&
        item.batchId > 0 &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0
      );

    if (!items.length) {
      alert('No valid return items were selected.');
      return;
    }

    const signature = JSON.stringify({
      saleId: sale.id,
      reason: data.reason,
      items
    });

    // Reuse the same key on retry of the same request. This allows
    // the backend to return an already-committed refund safely.
    if (
      !this.pendingRefundRequestKey ||
      this.pendingRefundSignature !== signature
    ) {
      this.pendingRefundRequestKey =
        `return-${sale.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      this.pendingRefundSignature = signature;
    }

    const request: SaleReturnCreateRequest = {
      requestKey: this.pendingRefundRequestKey,
      reason: data.reason,
      items
    };

    this.processingReturn = true;

    this.saleApiService.createReturn(tenantId, sale.id, request).subscribe({
      next: result => {
        this.processingReturn = false;
        this.showReturnModal = false;
        this.returnTarget = null;
        this.pendingRefundRequestKey = null;
        this.pendingRefundSignature = '';

        alert(
          `Return processed successfully. Refund reference: ${result.refundNumber}. ` +
          `Server-calculated refund: ৳${Number(result.refundAmount).toFixed(2)}`
        );

        this.loadSales();
      },
      error: error => {
        this.processingReturn = false;

        const message =
          error?.error?.detail ||
          error?.error?.message ||
          error?.error?.title ||
          'Return failed. Please check the sale, item quantities and backend connection.';

        // Keep the request key so retrying identical details is idempotent.
        alert(message);
      }
    });
  }

  // =========================
  // PRINT INVOICE
  // =========================

  printInvoice(): void {
    window.print();
  }
}
