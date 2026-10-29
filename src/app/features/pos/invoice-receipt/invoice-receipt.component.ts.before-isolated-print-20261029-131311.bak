import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface InvoiceReceiptItem {
  productName: string;
  sku?: string;
  batchNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceReceiptData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  items: InvoiceReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Card' | 'Mobile';
  amountReceived: number;
  change: number;
}

@Component({
  selector: 'app-invoice-receipt',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invoice-receipt.component.html',
  styleUrl: './invoice-receipt.component.scss'
})
export class InvoiceReceiptComponent {

  @Input() visible = false;

  @Input() receipt: InvoiceReceiptData | null = null;

  @Output() closed = new EventEmitter<void>();

  @Output() printed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

 printReceipt(): void {

  document.body.classList.add('receipt-printing');

  setTimeout(() => {

    window.print();

    setTimeout(() => {
      document.body.classList.remove('receipt-printing');
    }, 500);

  }, 100);

  this.printed.emit();
}
}