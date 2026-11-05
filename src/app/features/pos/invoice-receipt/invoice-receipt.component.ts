import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SaleApiService } from '../../../core/services/sale-api.service';

export interface InvoiceReceiptItem {
  productName: string;
  sku?: string;
  batchNumber?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface InvoiceReceiptData {
  saleId: number;
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
export class InvoiceReceiptComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() receipt: InvoiceReceiptData | null = null;
  @Input() tenantId = 0;

  @Output() closed = new EventEmitter<void>();
  @Output() printed = new EventEmitter<void>();

  downloadingInvoice = false;
  loadingInvoice = false;
  invoiceError = '';
  pdfPreviewUrl: SafeResourceUrl | null = null;

  private pdfBlob: Blob | null = null;
  private objectUrl: string | null = null;
  private requestedSaleId: number | null = null;

  constructor(
    private saleApiService: SaleApiService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.visible &&
      this.receipt &&
      (
        changes['visible'] ||
        changes['receipt'] ||
        changes['tenantId']
      )
    ) {
      this.loadInvoice();
    }
  }

  private loadInvoice(): void {
    if (!this.receipt || this.loadingInvoice) {
      return;
    }

    if (!Number.isSafeInteger(this.tenantId) || this.tenantId <= 0) {
      this.invoiceError = 'Tenant information is missing. Please log in again.';
      return;
    }

    if (!Number.isSafeInteger(this.receipt.saleId) || this.receipt.saleId <= 0) {
      this.invoiceError = 'Saved sale ID is missing. Cannot load Jasper invoice.';
      return;
    }

    if (
      this.requestedSaleId === this.receipt.saleId &&
      this.pdfBlob
    ) {
      return;
    }

    this.clearPdf();
    this.requestedSaleId = this.receipt.saleId;
    this.loadingInvoice = true;
    this.invoiceError = '';

    this.saleApiService.downloadInvoice(
      this.tenantId,
      this.receipt.saleId
    ).subscribe({
      next: pdf => {
        this.pdfBlob = pdf;
        this.objectUrl = window.URL.createObjectURL(pdf);
        this.pdfPreviewUrl =
          this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
        this.loadingInvoice = false;
      },
      error: error => {
        console.error('Jasper invoice loading failed:', error);
        this.loadingInvoice = false;
        this.invoiceError =
          error?.error?.message ||
          'Jasper invoice could not be loaded. Please try again.';
      }
    });
  }

  downloadInvoice(): void {
    if (!this.pdfBlob || !this.receipt || this.downloadingInvoice) {
      return;
    }

    this.downloadingInvoice = true;

    const url = window.URL.createObjectURL(this.pdfBlob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `${this.receipt.invoiceNumber || `SALE-${this.receipt.saleId}`}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      window.URL.revokeObjectURL(url);
      this.downloadingInvoice = false;
    }, 1000);
  }

  printInvoice(): void {
    if (!this.pdfBlob) {
      return;
    }

    const url = window.URL.createObjectURL(this.pdfBlob);
    const printWindow = window.open(url, '_blank');

    if (!printWindow) {
      window.URL.revokeObjectURL(url);
      alert('Please allow pop-ups to print the invoice.');
      return;
    }

    printWindow.addEventListener('afterprint', () => {
      window.URL.revokeObjectURL(url);
    }, { once: true });

    this.printed.emit();
  }

  loadInvoiceForRetry(): void {
    this.requestedSaleId = null;
    this.loadInvoice();
  }

  close(): void {
    this.closed.emit();
  }

  private clearPdf(): void {
    if (this.objectUrl) {
      window.URL.revokeObjectURL(this.objectUrl);
    }

    this.objectUrl = null;
    this.pdfBlob = null;
    this.pdfPreviewUrl = null;
    this.requestedSaleId = null;
  }

  ngOnDestroy(): void {
    this.clearPdf();
  }
}
