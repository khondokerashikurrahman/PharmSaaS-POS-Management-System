import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseOrderApiService, PurchaseOrderResponse } from '../../../core/services/purchase-order-api.service';

interface PurchaseOrderItem {
  medicine: string;
  batch: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface PurchaseOrderDetails {
  id: string;
  backendId: number;
  subtotalValue: number;
  taxValue: number;
  totalAmountValue: number;
  supplier: string;
  supplierContact: string;
  supplierEmail: string;
  orderDate: string;
  expectedDate: string;
  paymentTerms: string;
  status: 'Draft' | 'Pending' | 'Approved' | 'Completed' | 'Cancelled';
  notes: string;
  items: PurchaseOrderItem[];
}

@Component({
  selector: 'app-purchase-order-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './purchase-order-details.component.html',
  styleUrl: './purchase-order-details.component.scss'
})
export class PurchaseOrderDetailsComponent implements OnInit {

  orderId = '';

  purchaseOrder: PurchaseOrderDetails = {
    id: '',
    backendId: 0,
    subtotalValue: 0,
    taxValue: 0,
    totalAmountValue: 0,
    supplier: '',
    supplierContact: 'Not recorded',
    supplierEmail: 'Not recorded',
    orderDate: '—',
    expectedDate: 'Not specified',
    paymentTerms: 'Not specified',
    status: 'Draft',
    notes: '',
    items: []
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private purchaseOrderApi: PurchaseOrderApiService
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.orderId) {
      alert('Purchase Order ID পাওয়া যায়নি।');
      this.backToOrders();
      return;
    }

    this.loadPurchaseOrder(this.orderId);
  }

  private getTenantId(): number {
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

    return Number.isSafeInteger(tenantId) && tenantId > 0 ? tenantId : 0;
  }

  private loadPurchaseOrder(id: string): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      alert('Tenant ID পাওয়া যায়নি। আবার login করুন।');
      this.backToOrders();
      return;
    }

    const handleOrder = (order: PurchaseOrderResponse | undefined) => {
      if (!order) {
        alert('এই Purchase Order পাওয়া যায়নি।');
        this.backToOrders();
        return;
      }

      const statusMap: Record<string, PurchaseOrderDetails['status']> = {
        DRAFT: 'Draft',
        PENDING: 'Pending',
        APPROVED: 'Approved',
        RECEIVED: 'Completed',
        CANCELLED: 'Cancelled'
      };

      this.purchaseOrder = {
        id: order.orderNumber,
        backendId: order.id,
        subtotalValue: Number(order.subtotal || 0),
        taxValue: Number(order.tax || 0),
        totalAmountValue: Number(order.totalAmount || 0),
        supplier: order.supplierName || 'Not recorded',
        supplierContact: 'Not recorded',
        supplierEmail: 'Not recorded',
        orderDate: order.orderDate || '—',
        expectedDate: order.expectedDeliveryDate || 'Not specified',
        paymentTerms: 'Not specified',
        status: statusMap[(order.status || '').toUpperCase()] || 'Draft',
        notes: order.notes || '',
        items: (order.items || []).map(item => ({
          medicine: item.medicineName || 'Unknown medicine',
          batch: 'Assigned when goods are received',
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          total: Number(item.total || 0)
        }))
      };
    };

    if (/^\d+$/.test(id)) {
      this.purchaseOrderApi.getById(tenantId, Number(id)).subscribe({
        next: order => handleOrder(order),
        error: error => {
          console.error('Could not load Purchase Order', error);
          alert(error?.error?.message || 'Purchase Order load হয়নি।');
          this.backToOrders();
        }
      });
      return;
    }

    this.purchaseOrderApi.list(tenantId).subscribe({
      next: orders => {
        handleOrder(orders.find(order => order.orderNumber === id));
      },
      error: error => {
        console.error('Could not load Purchase Orders', error);
        alert(error?.error?.message || 'Purchase Order load হয়নি।');
        this.backToOrders();
      }
    });
  }

  get subtotal(): number {
    return this.purchaseOrder.subtotalValue;
  }

  get tax(): number {
    return this.purchaseOrder.taxValue;
  }

  get grandTotal(): number {
    return this.purchaseOrder.totalAmountValue;
  }

  get totalItems(): number {
    return this.purchaseOrder.items.reduce(
      (total, item) => total + item.quantity,
      0
    );
  }

  getStatusClass(
    status: PurchaseOrderDetails['status']
  ): string {
    switch (status) {
      case 'Approved':
        return 'status-approved';

      case 'Pending':
        return 'status-pending';

      case 'Completed':
        return 'status-completed';

      case 'Draft':
        return 'status-draft';

      case 'Cancelled':
        return 'status-cancelled';

      default:
        return '';
    }
  }

  editOrder(): void {
    if (!this.purchaseOrder.backendId) return;

    this.router.navigate([
      '/app/procurement/purchase-orders',
      this.purchaseOrder.backendId,
      'edit'
    ]);
  }

  createGRN(): void {
    this.router.navigate([
      '/app/procurement/grn-entry'
    ]);
  }

  backToOrders(): void {
    this.router.navigate([
      '/app/procurement/purchase-orders'
    ]);
  }

  printPurchaseOrder(): void {
    window.print();
  }
}