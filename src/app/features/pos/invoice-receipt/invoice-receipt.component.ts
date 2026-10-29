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
    const original = document.querySelector(
      '.receipt-overlay .receipt-content'
    ) as HTMLElement | null;

    if (!original || !this.receipt) {
      console.error('Invoice content not found; printing was cancelled.');
      return;
    }

    document.getElementById('pharmsaas-print-root')?.remove();

    // Print a detached copy so the application layout and modal scroll
    // cannot create extra pages or clip the receipt.
    const printRoot = document.createElement('div');
    printRoot.id = 'pharmsaas-print-root';
    printRoot.appendChild(original.cloneNode(true));
    document.body.appendChild(printRoot);
    document.body.classList.add('receipt-printing');

    let fallbackTimer: number | undefined;

    const cleanup = (): void => {
      if (fallbackTimer !== undefined) {
        window.clearTimeout(fallbackTimer);
      }
      window.removeEventListener('afterprint', cleanup);
      printRoot.remove();
      document.body.classList.remove('receipt-printing');
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    fallbackTimer = window.setTimeout(cleanup, 60000);

    window.setTimeout(() => {
      try {
        window.print();
      } catch (error) {
        cleanup();
        console.error('Invoice print failed:', error);
      }
    }, 150);

    this.printed.emit();
  }
}