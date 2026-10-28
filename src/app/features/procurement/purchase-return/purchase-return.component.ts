
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface ReturnItem {
  medicine: string;
  batch: string;
  availableQty: number;
  returnQty: number;
  unitPrice: number;
  reason: string;
  total: number;
}

@Component({
  selector: 'app-purchase-return',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './purchase-return.component.html',
  styleUrl: './purchase-return.component.scss'
})
export class PurchaseReturnComponent {

  purchaseOrder = '';
  supplier = '';
  returnDate = '2026-09-13';
  invoiceNumber = '';
  returnReason = 'Damaged / Defective';
  notes = '';

  purchaseOrders = [
    'PO-2026-001',
    'PO-2026-002',
    'PO-2026-003',
    'PO-2026-005'
  ];

  suppliers = [
    'Square Pharmaceuticals',
    'Beximco Pharmaceuticals',
    'Incepta Pharmaceuticals',
    'Renata Limited',
    'ACI Limited',
    'Healthcare Pharmaceuticals'
  ];

  medicines = [
    'Napa 500mg',
    'Seclo 20mg',
    'Fexo 120mg',
    'DPH 10mg',
    'Napa Extra',
    'Sergel 20mg'
  ];

  returnReasons = [
    'Damaged / Defective',
    'Expired / Near Expiry',
    'Wrong Medicine',
    'Wrong Quantity',
    'Quality Issue',
    'Other'
  ];

  items: ReturnItem[] = [
    {
      medicine: '',
      batch: '',
      availableQty: 0,
      returnQty: 0,
      unitPrice: 0,
      reason: 'Damaged / Defective',
      total: 0
    }
  ];

  constructor(
    private router: Router
  ) {}

  onPurchaseOrderChange(): void {
    if (this.purchaseOrder === 'PO-2026-001') {
      this.supplier = 'Square Pharmaceuticals';
      this.items[0].availableQty = 100;
    } else if (this.purchaseOrder === 'PO-2026-002') {
      this.supplier = 'Beximco Pharmaceuticals';
      this.items[0].availableQty = 80;
    } else if (this.purchaseOrder === 'PO-2026-003') {
      this.supplier = 'Incepta Pharmaceuticals';
      this.items[0].availableQty = 120;
    } else if (this.purchaseOrder === 'PO-2026-005') {
      this.supplier = 'ACI Limited';
      this.items[0].availableQty = 60;
    } else {
      this.supplier = '';
      this.items[0].availableQty = 0;
    }

    this.items.forEach(item => {
      item.returnQty = 0;
      this.calculateTotal(item);
    });
  }

  addItem(): void {
    this.items.push({
      medicine: '',
      batch: '',
      availableQty: 0,
      returnQty: 0,
      unitPrice: 0,
      reason: this.returnReason,
      total: 0
    });
  }

  removeItem(index: number): void {
    if (this.items.length === 1) {
      return;
    }

    this.items.splice(index, 1);
  }

  calculateTotal(item: ReturnItem): void {
    item.total =
      Number(item.returnQty || 0) *
      Number(item.unitPrice || 0);
  }

  get totalItems(): number {
    return this.items.length;
  }

  get totalReturnQty(): number {
    return this.items.reduce(
      (total, item) =>
        total + Number(item.returnQty || 0),
      0
    );
  }

  get returnValue(): number {
    return this.items.reduce(
      (total, item) =>
        total + Number(item.total || 0),
      0
    );
  }

  get taxAdjustment(): number {
    return this.returnValue * 0.05;
  }

  get totalRefund(): number {
    return this.returnValue + this.taxAdjustment;
  }

  saveDraft(): void {
    if (!this.purchaseOrder) {
      alert('Please select a purchase order.');
      return;
    }

    alert('Purchase return saved as draft.');
    this.router.navigate(['/app/procurement/purchase-return']);
  }

  submitReturn(): void {
    if (!this.purchaseOrder) {
      alert('Please select a purchase order.');
      return;
    }

    if (!this.supplier) {
      alert('Please select a supplier.');
      return;
    }

    const invalidItem = this.items.some(
      item =>
        !item.medicine ||
        !item.batch ||
        item.returnQty <= 0 ||
        item.unitPrice <= 0
    );

    if (invalidItem) {
      alert('Please complete all return item information.');
      return;
    }

    const exceedsStock = this.items.some(
      item => item.returnQty > item.availableQty
    );

    if (exceedsStock) {
      alert('Return quantity cannot exceed available quantity.');
      return;
    }

    alert('Purchase return submitted successfully.');
    this.router.navigate(['/app/procurement']);
  }

  cancel(): void {
    this.router.navigate(['/app/procurement']);
  }

  getReasonClass(reason: string): string {
    switch (reason) {
      case 'Damaged / Defective':
        return 'reason-danger';

      case 'Expired / Near Expiry':
        return 'reason-warning';

      case 'Wrong Medicine':
      case 'Wrong Quantity':
        return 'reason-info';

      case 'Quality Issue':
        return 'reason-purple';

      default:
        return 'reason-default';
    }
  }

  trackByMedicine(
    index: number,
    item: ReturnItem
  ): string {
    return `${item.medicine}-${item.batch}-${index}`;
  }
}
