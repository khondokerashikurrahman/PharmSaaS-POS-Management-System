import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  PurchaseOrderApiService,
  PurchaseOrderRequest
} from '../../../core/services/purchase-order-api.service';
import { TenantInventoryApiService, TenantInventoryItem } from '../../../core/services/tenant-inventory-api.service';
import { SupplierApiService, SupplierResponse } from '../../../core/services/supplier-api.service';

interface PurchaseItem {
  medicine: string;
  inventoryItemId: number | null;
  batch: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

@Component({
  selector: 'app-purchase-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-order-form.component.html',
  styleUrl: './purchase-order-form.component.scss'
})
export class PurchaseOrderFormComponent implements OnInit {
  supplier = '';
  orderDate = new Date().toISOString().slice(0, 10);
  expectedDate = '';
  paymentTerms = 'Cash';
  notes = '';
  saving = false;
  message = '';
  messageType: 'success' | 'error' = 'success';
  medicines: TenantInventoryItem[] = [];
  medicineLoading = false;
  medicineLoadError = '';

  items: PurchaseItem[] = [
    { medicine: '', inventoryItemId: null, batch: '', quantity: 1, unitPrice: 0, total: 0 }
  ];

  suppliers: SupplierResponse[] = [];
  loadingSuppliers = false;
  supplierLoadError = '';



  constructor(
    private router: Router,
    private purchaseOrderApi: PurchaseOrderApiService,
    private inventoryApi: TenantInventoryApiService,
    private supplierApi: SupplierApiService
  ) {}

  ngOnInit(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.medicineLoadError = 'Tenant ID পাওয়া যায়নি। আবার login করুন।';
      return;
    }

    this.loadingSuppliers = true;
    this.supplierLoadError = '';
    this.supplierApi.list(tenantId).subscribe({
      next: suppliers => {
        this.suppliers = (suppliers || []).filter(
          item => String(item.status || '').toUpperCase() === 'ACTIVE'
        );
        this.loadingSuppliers = false;
        if (!this.suppliers.length) {
          this.supplierLoadError =
            'কোনো Active Supplier পাওয়া যায়নি। আগে Supplier Management থেকে supplier যোগ করুন।';
        }
      },
      error: err => {
        this.loadingSuppliers = false;
        this.suppliers = [];
        this.supplierLoadError =
          err?.error?.message || 'Supplier list load করা যায়নি। Login ও permission যাচাই করুন।';
      }
    });

    this.medicineLoading = true;
    this.inventoryApi.list(tenantId).subscribe({
      next: medicines => {
        this.medicines = (medicines || []).filter(
          medicine => Number.isSafeInteger(Number(medicine.id))
            && Number(medicine.id) > 0
        );
        this.medicineLoading = false;

        if (!this.medicines.length) {
          this.medicineLoadError =
            'এই tenant-এর inventory-তে কোনো medicine পাওয়া যায়নি।';
        } else {
          this.medicineLoadError = '';
        }
      },
      error: err => {
        this.medicineLoading = false;
        this.medicineLoadError =
          err?.error?.message || 'Inventory medicines load করা যায়নি।';
      }
    });
  }

  onMedicineSelected(
    item: PurchaseItem,
    value: number | string | null
  ): void {
    const id = value === null || value === '' ? 0 : Number(value);
    const selected = this.medicines.find(
      medicine => Number(medicine.id) === id
    );

    item.inventoryItemId = selected ? Number(selected.id) : null;
    item.medicine = selected?.name || '';
  }

  private getTenantId(): number {
    for (const key of ['tenantId', 'tenant_id']) {
      const id = Number(localStorage.getItem(key) || 0);
      if (Number.isSafeInteger(id) && id > 0) return id;
    }

    try {
      const user = JSON.parse(localStorage.getItem('pharm_user') || '{}');
      const candidates = [
        user.tenantId,
        user.tenant?.id,
        user.currentTenantId
      ];

      for (const candidate of candidates) {
        const id = Number(candidate || 0);
        if (Number.isSafeInteger(id) && id > 0) return id;
      }
    } catch {
      // Invalid or missing stored user data.
    }

    return 0;
  }

  addItem(): void {
    this.items.push({
      medicine: '',
      inventoryItemId: null,
      batch: '',
      quantity: 1,
      unitPrice: 0,
      total: 0
    });
  }

  removeItem(index: number): void {
    if (this.items.length > 1) this.items.splice(index, 1);
  }

  calculateItemTotal(item: PurchaseItem): void {
    item.total = Number(item.quantity || 0) * Number(item.unitPrice || 0);
  }

  get subtotal(): number {
    return this.items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  }

  get tax(): number {
    return this.subtotal * 0.05;
  }

  get grandTotal(): number {
    return this.subtotal + this.tax;
  }

  private buildRequest(): PurchaseOrderRequest | null {
    if (!this.supplier) {
      this.showError('Please select a supplier.');
      return null;
    }

    if (!this.orderDate) {
      this.showError('Please select order date.');
      return null;
    }

    if (!this.items.length || this.items.some(item =>
      !item.medicine ||
      !Number.isSafeInteger(Number(item.inventoryItemId)) ||
      Number(item.inventoryItemId) <= 0 ||
      !Number.isFinite(Number(item.quantity)) ||
      Number(item.quantity) <= 0 ||
      !Number.isFinite(Number(item.unitPrice)) ||
      Number(item.unitPrice) <= 0
    )) {
      this.showError('Please complete all medicine items with valid quantity and price.');
      return null;
    }

    if (this.expectedDate && this.expectedDate < this.orderDate) {
      this.showError('Expected delivery date cannot be before order date.');
      return null;
    }

    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.showError('Tenant ID পাওয়া যায়নি। আবার login করুন।');
      return null;
    }

    return {
      supplierName: this.supplier,
      orderDate: this.orderDate,
      expectedDeliveryDate: this.expectedDate || undefined,
      discount: 0,
      tax: Number(this.tax.toFixed(2)),
      notes: [
        this.notes.trim(),
        `Payment terms: ${this.paymentTerms}`,
        ...this.items.filter(i => i.batch.trim()).map(
          i => `${i.medicine} batch reference: ${i.batch.trim()}`
        )
      ].filter(Boolean).join('\n'),
      items: this.items.map(item => ({
        inventoryItemId: Number(item.inventoryItemId),
        medicineName: item.medicine,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        discount: 0,
        tax: 0
      }))
    };
  }

  private showError(message: string): void {
    this.messageType = 'error';
    this.message = message;
  }

  saveDraft(): void {
    this.saveOrder(false);
  }

  submitOrder(): void {
    if (!this.expectedDate) {
      this.showError('Please select expected delivery date.');
      return;
    }
    this.saveOrder(true);
  }

  private saveOrder(submit: boolean): void {
    if (this.saving) return;

    const request = this.buildRequest();
    if (!request) return;

    const tenantId = this.getTenantId();
    this.saving = true;
    this.message = '';

    this.purchaseOrderApi.create(tenantId, request).subscribe({
      next: order => {
        if (!submit) {
          this.saving = false;
          this.router.navigate(['/app/procurement/purchase-orders']);
          return;
        }

        this.purchaseOrderApi.submit(tenantId, order.id).subscribe({
          next: () => {
            this.saving = false;
            this.router.navigate(['/app/procurement/purchase-orders']);
          },
          error: err => {
            this.saving = false;
            this.showError(
              err?.error?.message ||
              'Order তৈরি হয়েছে, কিন্তু submit করা যায়নি। Order list থেকে আবার চেষ্টা করুন।'
            );
          }
        });
      },
      error: err => {
        this.saving = false;
        this.showError(
          err?.error?.message ||
          'Purchase Order save করা যায়নি। Backend, tenant status এবং permissions পরীক্ষা করুন।'
        );
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/app/procurement/purchase-orders']);
  }
}
