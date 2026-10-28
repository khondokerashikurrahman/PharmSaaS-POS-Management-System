import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  PurchaseOrderApiService,
  PurchaseOrderResponse
} from '../../../core/services/purchase-order-api.service';

type UiStatus =
  | 'Draft'
  | 'Pending'
  | 'Approved'
  | 'Partially Received'
  | 'Completed'
  | 'Cancelled';

interface PurchaseOrderRow {
  id: string;
  backendId: number;
  supplier: string;
  date: string;
  expectedDate: string;
  items: number;
  total: number;
  status: UiStatus;
}

@Component({
  selector: 'app-purchase-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-order-list.component.html',
  styleUrl: './purchase-order-list.component.scss'
})
export class PurchaseOrderListComponent implements OnInit {
  searchTerm = '';
  selectedStatus = 'All';
  purchaseOrders: PurchaseOrderRow[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private purchaseOrderApi: PurchaseOrderApiService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  private getTenantId(): number {
    const id = Number(localStorage.getItem('tenantId'));
    return Number.isSafeInteger(id) && id > 0 ? id : 0;
  }

  loadOrders(): void {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করুন।';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.purchaseOrderApi.list(tenantId).subscribe({
      next: orders => {
        this.purchaseOrders = orders.map(order => this.toRow(order));
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message ||
          'Purchase Orders load করা যায়নি। Backend এবং login status পরীক্ষা করুন।';
      }
    });
  }

  private toRow(order: PurchaseOrderResponse): PurchaseOrderRow {
    return {
      id: order.orderNumber,
      backendId: order.id,
      supplier: order.supplierName,
      date: order.orderDate || '',
      expectedDate: order.expectedDeliveryDate || '—',
      items: order.items?.length ?? 0,
      total: Number(order.totalAmount || 0),
      status: this.toUiStatus(order.status)
    };
  }

  private toUiStatus(status: string): UiStatus {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return 'Draft';
      case 'PENDING': return 'Pending';
      case 'APPROVED': return 'Approved';
      case 'PARTIALLY_RECEIVED': return 'Partially Received';
      case 'RECEIVED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return 'Draft';
    }
  }

  get filteredOrders(): PurchaseOrderRow[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.purchaseOrders.filter(order => {
      const matchesSearch =
        !search ||
        order.id.toLowerCase().includes(search) ||
        order.supplier.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        order.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  get totalOrders(): number {
    return this.purchaseOrders.length;
  }

  get pendingOrders(): number {
    return this.purchaseOrders.filter(o => o.status === 'Pending').length;
  }

  get approvedOrders(): number {
    return this.purchaseOrders.filter(o => o.status === 'Approved').length;
  }

  get completedOrders(): number {
    return this.purchaseOrders.filter(o => o.status === 'Completed').length;
  }

  get totalPurchaseValue(): number {
    return this.purchaseOrders.reduce((sum, o) => sum + o.total, 0);
  }

  createPurchaseOrder(): void {
    this.router.navigate(['/app/procurement/purchase-orders/new']);
  }

  viewOrder(order: PurchaseOrderRow): void {
    this.router.navigate([
      '/app/procurement/purchase-orders',
      order.backendId
    ]);
  }

  editOrder(order: PurchaseOrderRow): void {
    if (order.status !== 'Draft') {
      this.errorMessage = 'শুধু Draft order edit করা যাবে।';
      return;
    }
    this.router.navigate([
      '/app/procurement/purchase-orders',
      order.backendId,
      'edit'
    ]);
  }

  getStatusClass(status: UiStatus): string {
    switch (status) {
      case 'Approved': return 'status-approved';
      case 'Pending': return 'status-pending';
      case 'Completed': return 'status-completed';
      case 'Draft': return 'status-draft';
      case 'Cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  }

  trackByOrderId(index: number, order: PurchaseOrderRow): string {
    return order.id;
  }
}
