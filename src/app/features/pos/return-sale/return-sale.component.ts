
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ReturnSaleItem {
  id: string;
  batchId: string;
  name: string;
  sku: string;
  batchNumber: string;
  quantity: number;
  soldQuantity: number;
  price: number;
  lineSubtotal: number;
  returnQuantity: number;
  selected: boolean;
}

export interface ReturnSaleData {
  invoice: string;
  customer: string;
  items: ReturnSaleItem[];
  reason: string;
  refundAmount: number;
}

@Component({
  selector: 'app-return-sale',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './return-sale.component.html',
  styleUrl: './return-sale.component.scss'
})
export class ReturnSaleComponent {

  @Input() sale: any = null;
  @Input() processing = false;

  @Output() closed = new EventEmitter<void>();
  @Output() returned = new EventEmitter<ReturnSaleData>();

  reason = '';

  reasons = [
    'Customer Return',
    'Wrong Product',
    'Damaged Product',
    'Expired Product',
    'Incorrect Quantity',
    'Other'
  ];

  returnItems: ReturnSaleItem[] = [];

  ngOnInit(): void {
    this.prepareItems();
  }

  prepareItems(): void {
    if (!this.sale?.saleItems) {
      this.returnItems = [];
      return;
    }

    this.returnItems = this.sale.saleItems.map((item: any) => {
      const soldQuantity = Math.max(Number(item.quantity || 0), 0);
      const remainingQuantity = Math.max(
        0,
        Number(item.remainingQuantity ?? soldQuantity)
      );

      return {
        id: item.id,
        batchId: String(item.batchId ?? ''),
        name: item.name,
        sku: item.sku,
        batchNumber: item.batchNumber,
        quantity: Math.min(remainingQuantity, soldQuantity),
        soldQuantity,
        price: Number(item.price || 0),
        lineSubtotal: Number(
          item.subtotal ??
          (soldQuantity * Number(item.price || 0))
        ),
        returnQuantity: 0,
        selected: false
      };
    });
  }

  get selectedItems(): ReturnSaleItem[] {
    return this.returnItems.filter(
      item => item.selected && item.returnQuantity > 0
    );
  }

  estimateLineRefund(item: ReturnSaleItem): number {
    if (item.returnQuantity <= 0) {
      return 0;
    }

    const baseTotal = this.returnItems.reduce(
      (sum, row) => sum + Math.max(Number(row.lineSubtotal || 0), 0),
      0
    );
    const saleTotal = Math.max(Number(this.sale?.total || 0), 0);
    const sold = Math.max(Number(item.soldQuantity || 0), 1);

    if (baseTotal <= 0 || saleTotal <= 0) {
      return Math.round(item.returnQuantity * item.price * 100) / 100;
    }

    const lineBase = Math.max(Number(item.lineSubtotal || 0), 0);
    const estimate = (saleTotal * lineBase / baseTotal)
      * item.returnQuantity / sold;

    return Math.round((estimate + Number.EPSILON) * 100) / 100;
  }

  get refundAmount(): number {
    const total = this.selectedItems.reduce(
      (sum, item) => sum + this.estimateLineRefund(item),
      0
    );
    return Math.round((total + Number.EPSILON) * 100) / 100;
  }

  increaseQuantity(item: ReturnSaleItem): void {
    if (item.returnQuantity < item.quantity) {
      item.returnQuantity++;
      item.selected = true;
    }
  }

  decreaseQuantity(item: ReturnSaleItem): void {
    if (item.returnQuantity > 0) {
      item.returnQuantity--;

      if (item.returnQuantity === 0) {
        item.selected = false;
      }
    }
  }

  toggleItem(item: ReturnSaleItem): void {
    item.selected = !item.selected;

    if (item.selected && item.returnQuantity === 0) {
      item.returnQuantity = 1;
    }

    if (!item.selected) {
      item.returnQuantity = 0;
    }
  }

  confirmReturn(): void {

    if (this.processing) {
      return;
    }

    if (!this.sale) {
      alert('No sale selected.');
      return;
    }

    if (this.selectedItems.length === 0) {
      alert('Please select at least one item to return.');
      return;
    }

    if (!this.reason) {
      alert('Please select a return reason.');
      return;
    }

    const confirmed = confirm(
      `Confirm return for invoice ${this.sale.invoice}?`
    );

    if (!confirmed) {
      return;
    }

    const returnData: ReturnSaleData = {
      invoice: this.sale.invoice,
      customer: this.sale.customer,
      items: this.selectedItems,
      reason: this.reason,
      refundAmount: this.refundAmount
    };

    this.returned.emit(returnData);
  }

  close(): void {
    this.closed.emit();
  }
}
