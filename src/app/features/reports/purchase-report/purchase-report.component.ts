import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PurchaseOrderApiService } from '../../../core/services/purchase-order-api.service';

import { GrnApiService, GrnResponse } from '../../../core/services/grn-api.service';
interface PurchaseOrder {
  id?: string | number;

  orderNumber?: string;
  poNumber?: string;
  invoice?: string;

  supplier?: string;
  supplierName?: string;

  date?: string;
  orderDate?: string;
  createdAt?: string;
  timestamp?: number;

  items?: number | Array<{ quantity?: number }>;
  totalItems?: number;
  quantity?: number;

  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  totalAmount?: number;
  grandTotal?: number;
  amount?: number;

  paymentMethod?: string;
  payment?: string;

  status?: string;
}

type DateRange =
  | 'today'
  | 'week'
  | 'month'
  | 'all'
  | 'custom';

@Component({
  selector: 'app-purchase-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './purchase-report.component.html',
  styleUrl: './purchase-report.component.scss'
})
export class PurchaseReportComponent implements OnInit {

  purchases: PurchaseOrder[] = [];
  goodsReceivedNotes: GrnResponse[] = [];

  selectedRange: DateRange = 'all';

  fromDate = '';
  toDate = '';

  constructor(private purchaseOrderApi: PurchaseOrderApiService, private grnApi: GrnApiService) {}

  // =========================
  // LIFECYCLE
  // =========================

  ngOnInit(): void {
    this.loadPurchases();
  }


  // =========================
  // LOAD PURCHASES
  // =========================

  loadPurchases(): void {
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
      this.purchases = [];
      alert('Tenant ID পাওয়া যায়নি। আবার login করুন।');
      return;
    }

    this.grnApi.list(tenantId).subscribe({
      next: notes => {
        this.goodsReceivedNotes = (notes || []).filter(
          note => String(note.status || '').toUpperCase() === 'RECEIVED'
        );
      },
      error: error => {
        console.error('Failed to load received goods report:', error);
        this.goodsReceivedNotes = [];
      }
    });

    this.purchaseOrderApi.list(tenantId).subscribe({
      next: orders => {
        this.purchases = (orders || []).map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          supplierName: order.supplierName,
          orderDate: order.orderDate,
          createdAt: order.createdAt,
          subtotal: Number(order.subtotal || 0),
          tax: Number(order.tax || 0),
          discount: Number(order.discount || 0),
          totalAmount: Number(order.totalAmount || 0),
          status: order.status,
          items: (order.items || []).map(item => ({
            quantity: Number(item.quantity || 0)
          }))
        }));
      },
      error: error => {
        console.error('Failed to load Purchase Report', error);
        this.purchases = [];
        alert(
          error?.error?.message ||
          'Purchase Report backend থেকে load হয়নি।'
        );
      }
    });
  }


  // =========================
  // DATE FILTER
  // =========================

  selectRange(range: DateRange): void {
    this.selectedRange = range;

    if (range !== 'custom') {
      this.fromDate = '';
      this.toDate = '';
    }
  }

  applyCustomDate(): void {

    if (!this.fromDate || !this.toDate) {
      alert(
        'Please select both From Date and To Date.'
      );
      return;
    }

    if (this.fromDate > this.toDate) {
      alert(
        'From Date cannot be greater than To Date.'
      );
      return;
    }

    this.selectedRange = 'custom';
  }


  // =========================
  // FILTERED PURCHASES
  // =========================

  get filteredPurchases(): PurchaseOrder[] {

    if (this.selectedRange === 'all') {
      return this.purchases;
    }

    const now = new Date();

    let startDate: Date;
    let endDate: Date;

    // TODAY
    if (this.selectedRange === 'today') {

      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );

      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );
    }

    // THIS WEEK
    else if (this.selectedRange === 'week') {

      const day = now.getDay();

      const diffToMonday =
        day === 0
          ? 6
          : day - 1;

      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - diffToMonday,
        0,
        0,
        0,
        0
      );

      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() +
          (6 - diffToMonday),
        23,
        59,
        59,
        999
      );
    }

    // THIS MONTH
    else if (this.selectedRange === 'month') {

      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0
      );

      endDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
    }

    // CUSTOM
    else {

      if (!this.fromDate || !this.toDate) {
        return [];
      }

      startDate = new Date(
        `${this.fromDate}T00:00:00`
      );

      endDate = new Date(
        `${this.toDate}T23:59:59.999`
      );

      if (startDate > endDate) {
        return [];
      }
    }

    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    return this.purchases.filter(order => {

      const orderTime =
        this.getOrderTimestamp(order);

      return (
        orderTime >= startTime &&
        orderTime <= endTime
      );
    });
  }


  // =========================
  // ORDER TIMESTAMP
  // =========================

  // =========================
  // GOODS RECEIVED (GRN)
  // =========================

  get filteredGrns(): GrnResponse[] {
    return this.goodsReceivedNotes.filter(grn =>
      this.isReceivedDateInSelectedRange(grn.receivedDate)
    );
  }

  get totalReceivedNotes(): number {
    return this.filteredGrns.length;
  }

  get totalReceivedQuantity(): number {
    return this.filteredGrns.reduce(
      (total, grn) => total + this.getGrnItemQuantity(grn), 0
    );
  }

  get totalReceivedValue(): number {
    return this.filteredGrns.reduce(
      (total, grn) => total + this.getGrnValue(grn), 0
    );
  }

  getGrnItemQuantity(grn: GrnResponse): number {
    return (grn.items || []).reduce(
      (total, item) => total + (Number(item.quantity) || 0), 0
    );
  }

  getGrnValue(grn: GrnResponse): number {
    return (grn.items || []).reduce(
      (total, item) => total + (Number(item.lineTotal) || 0), 0
    );
  }

  private isReceivedDateInSelectedRange(value: string | null | undefined): boolean {
    if (!value) return false;
    if (this.selectedRange === 'all') return true;

    // Backend receivedDate is a LocalDate in YYYY-MM-DD format.
    const receivedDate = new Date(`${value}T12:00:00`);
    if (Number.isNaN(receivedDate.getTime())) return false;

    if (this.selectedRange === 'custom') {
      return !!this.fromDate && !!this.toDate &&
        this.fromDate <= value && value <= this.toDate;
    }

    const now = new Date();

    if (this.selectedRange === 'today') {
      return receivedDate.getFullYear() === now.getFullYear() &&
        receivedDate.getMonth() === now.getMonth() &&
        receivedDate.getDate() === now.getDate();
    }

    if (this.selectedRange === 'month') {
      return receivedDate.getFullYear() === now.getFullYear() &&
        receivedDate.getMonth() === now.getMonth();
    }

    if (this.selectedRange === 'week') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      return receivedDate.getTime() >= start.getTime() &&
        receivedDate.getTime() <= end.getTime();
    }

    return true;
  }

  private getOrderTimestamp(
    order: PurchaseOrder
  ): number {

    if (
      order.timestamp !== undefined &&
      order.timestamp !== null
    ) {

      const timestamp =
        Number(order.timestamp);

      if (!isNaN(timestamp)) {

        // Unix timestamp in seconds
        if (timestamp < 10000000000) {
          return timestamp * 1000;
        }

        // Unix timestamp in milliseconds
        return timestamp;
      }
    }

    const dateValue =
      order.date ||
      order.orderDate ||
      order.createdAt;

    if (!dateValue) {
      return 0;
    }

    const parsedDate =
      new Date(dateValue).getTime();

    return isNaN(parsedDate)
      ? 0
      : parsedDate;
  }


  // =========================
  // STATUS LISTS
  // =========================

  get completedPurchases(): PurchaseOrder[] {

    return this.filteredPurchases.filter(
      order =>
        this.getNormalizedStatus(order) ===
        'Completed'
    );
  }

  get pendingPurchases(): PurchaseOrder[] {

    return this.filteredPurchases.filter(
      order =>
        ['Pending', 'Draft'].includes(
          this.getNormalizedStatus(order)
        )
    );
  }

  get cancelledPurchases(): PurchaseOrder[] {

    return this.filteredPurchases.filter(
      order =>
        this.getNormalizedStatus(order) ===
        'Cancelled'
    );
  }


  // =========================
  // MAIN STATISTICS
  // =========================

  get totalPurchases(): number {
    return this.completedPurchases.length;
  }

  get totalPurchaseAmount(): number {

    return this.completedPurchases.reduce(
      (total, order) =>
        total + this.getOrderAmount(order),
      0
    );
  }

  get totalPendingAmount(): number {

    return this.pendingPurchases.reduce(
      (total, order) =>
        total + this.getOrderAmount(order),
      0
    );
  }

  get totalCancelledAmount(): number {

    return this.cancelledPurchases.reduce(
      (total, order) =>
        total + this.getOrderAmount(order),
      0
    );
  }

  get totalItemsPurchased(): number {

    return this.completedPurchases.reduce(
      (total, order) =>
        total + this.getOrderItems(order),
      0
    );
  }

  get averagePurchase(): number {

    if (this.totalPurchases === 0) {
      return 0;
    }

    return (
      this.totalPurchaseAmount /
      this.totalPurchases
    );
  }

  get refundedAmount(): number {

    return this.filteredPurchases
      .filter(
        order =>
          this.getNormalizedStatus(order) ===
          'Refunded'
      )
      .reduce(
        (total, order) =>
          total + this.getOrderAmount(order),
        0
      );
  }


  // =========================
  // SELECTED PERIOD LABEL
  // =========================

  get selectedRangeLabel(): string {

    switch (this.selectedRange) {

      case 'today':
        return 'Today';

      case 'week':
        return 'This Week';

      case 'month':
        return 'This Month';

      case 'custom':
        return `${this.fromDate} to ${this.toDate}`;

      default:
        return 'All Time';
    }
  }


  // =========================
  // PAYMENT
  // =========================

  getPaymentMethod(
    order: PurchaseOrder
  ): string {

    const value =
      order.paymentMethod ||
      order.payment ||
      'Not recorded';

    const normalized =
      String(value).toLowerCase();

    if (
      normalized.includes('mobile')
    ) {
      return 'Mobile';
    }

    if (
      normalized.includes('credit')
    ) {
      return 'Credit';
    }

    if (
      normalized.includes('card')
    ) {
      return 'Card';
    }

    if (
      normalized.includes('bank') ||
      normalized.includes('transfer')
    ) {
      return 'Bank';
    }

    return 'Cash';
  }

  getPaymentAmount(
    method: string
  ): number {

    return this.completedPurchases
      .filter(
        order =>
          this.getPaymentMethod(order) ===
          method
      )
      .reduce(
        (total, order) =>
          total + this.getOrderAmount(order),
        0
      );
  }

  getPaymentTransactions(
    method: string
  ): number {

    return this.completedPurchases
      .filter(
        order =>
          this.getPaymentMethod(order) ===
          method
      )
      .length;
  }

  getPaymentPercentage(
    method: string
  ): number {

    if (this.totalPurchaseAmount === 0) {
      return 0;
    }

    return (
      this.getPaymentAmount(method) /
      this.totalPurchaseAmount
    ) * 100;
  }


  // =========================
  // ORDER DATA
  // =========================

  getOrderAmount(
    order: PurchaseOrder
  ): number {

    const amount =
      order.total ??
      order.totalAmount ??
      order.grandTotal ??
      order.amount ??
      0;

    return Number(amount) || 0;
  }

  getOrderItems(
    order: PurchaseOrder
  ): number {

    if (Array.isArray(order.items)) {
      return order.items.reduce(
        (sum, item) => sum + Number(item.quantity || 0),
        0
      );
    }

    const items =
      order.items ??
      order.totalItems ??
      order.quantity ??
      0;

    return Number(items) || 0;
  }

  getOrderNumber(
    order: PurchaseOrder
  ): string {

    return String(
      order.orderNumber ??
      order.poNumber ??
      order.invoice ??
      order.id ??
      'N/A'
    );
  }

  getSupplierName(
    order: PurchaseOrder
  ): string {

    return (
      order.supplierName ||
      order.supplier ||
      'Unknown Supplier'
    );
  }


  // =========================
  // ORDER DATE
  // =========================

  getOrderDate(
    order: PurchaseOrder
  ): Date | null {

    const timestamp =
      this.getOrderTimestamp(order);

    if (timestamp <= 0) {
      return null;
    }

    return new Date(timestamp);
  }


  // =========================
  // ORDER STATUS
  // =========================

  getNormalizedStatus(
    order: PurchaseOrder
  ): string {

    const status =
      String(
        order.status || 'Pending'
      ).toLowerCase();

    if (
      status.includes('complete') ||
      status.includes('received')
    ) {
      return 'Completed';
    }

    if (status.includes('draft')) {
      return 'Draft';
    }

    if (
      status.includes('cancel') ||
      status.includes('reject')
    ) {
      return 'Cancelled';
    }

    if (
      status.includes('refund')
    ) {
      return 'Refunded';
    }

    return 'Pending';
  }

  getStatusClass(
    status: string
  ): string {

    switch (
      this.getNormalizedStatus({
        status
      })
    ) {

      case 'Completed':
        return 'status-completed';

      case 'Cancelled':
        return 'status-cancelled';

      case 'Refunded':
        return 'status-refunded';

      default:
        return 'status-pending';
    }
  }


  // =========================
  // REFRESH
  // =========================

  refreshReport(): void {
    this.loadPurchases();
  }


  // =========================
  // TRACK BY
  // =========================

  trackByOrder(
    index: number,
    order: PurchaseOrder
  ): string | number {

    return (
      order.id ??
      order.orderNumber ??
      order.poNumber ??
      index
    );
  }
}