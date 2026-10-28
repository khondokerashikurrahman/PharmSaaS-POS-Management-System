import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  SupplierApiService,
  SupplierResponse
} from '../../../core/services/supplier-api.service';
import {
  PurchaseOrderApiService,
  PurchaseOrderResponse
} from '../../../core/services/purchase-order-api.service';

@Component({
  selector: 'app-supplier-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './supplier-details.component.html',
  styleUrl: './supplier-details.component.scss'
})
export class SupplierDetailsComponent implements OnInit {
  supplierId = 0;
  supplier: SupplierResponse | null = null;
  orders: PurchaseOrderResponse[] = [];

  loadingSupplier = false;
  loadingOrders = false;
  error = '';
  ordersError = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly supplierApi: SupplierApiService,
    private readonly purchaseOrderApi: PurchaseOrderApiService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const tenantId = this.getTenantId();

    if (!Number.isSafeInteger(id) || id <= 0) {
      this.error = 'Invalid supplier ID.';
      return;
    }

    if (!tenantId) {
      this.error = 'Tenant ID পাওয়া যায়নি। আবার tenant account দিয়ে login করুন।';
      return;
    }

    this.supplierId = id;
    this.loadingSupplier = true;
    this.error = '';

    this.supplierApi.getById(tenantId, id).subscribe({
      next: supplier => {
        this.supplier = supplier;
        this.loadingSupplier = false;
        this.loadPurchaseOrders(tenantId, supplier.name);
      },
      error: err => {
        this.loadingSupplier = false;
        this.error =
          err?.error?.message ||
          'Supplier details load করা যায়নি। Login, tenant ও permission যাচাই করুন।';
      }
    });
  }

  private getTenantId(): number {
    const id = Number(localStorage.getItem('tenantId'));
    return Number.isSafeInteger(id) && id > 0 ? id : 0;
  }

  private loadPurchaseOrders(tenantId: number, supplierName: string): void {
    this.loadingOrders = true;
    this.ordersError = '';

    this.purchaseOrderApi.list(tenantId).subscribe({
      next: orders => {
        const normalizedName = (supplierName || '').trim().toLowerCase();

        this.orders = (orders || [])
          .filter(order =>
            (order.supplierName || '').trim().toLowerCase() === normalizedName
          )
          .sort((a, b) =>
            String(b.orderDate || '').localeCompare(String(a.orderDate || ''))
          );

        this.loadingOrders = false;
      },
      error: err => {
        this.orders = [];
        this.loadingOrders = false;
        this.ordersError =
          err?.error?.message ||
          'Purchase Order history load করা যায়নি।';
      }
    });
  }

  get totalOrders(): number {
    return this.orders.length;
  }

  get nonCancelledOrderValue(): number {
    return this.orders
      .filter(order => (order.status || '').toUpperCase() !== 'CANCELLED')
      .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  }

  get latestOrderDate(): string | null {
    return this.orders[0]?.orderDate || null;
  }

  getStatusClass(status: string): string {
    return status?.toLowerCase() === 'active'
      ? 'status-active'
      : 'status-inactive';
  }

  getOrderStatusClass(status: string): string {
    const normalized = (status || 'unknown')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return 'purchase-status status-' + normalized;
  }

  goBack(): void {
    this.router.navigate(['/app/stakeholders/suppliers']);
  }

  openLedger(): void {
    if (!this.supplier) return;

    this.router.navigate(
      ['/app/stakeholders/suppliers/ledger'],
      { queryParams: { supplierId: this.supplier.id } }
    );
  }

  editSupplier(): void {
    if (!this.supplier) return;

    this.router.navigate(
      ['/app/stakeholders/suppliers'],
      { queryParams: { editSupplierId: this.supplier.id } }
    );
  }

  printDetails(): void {
    window.print();
  }
}
