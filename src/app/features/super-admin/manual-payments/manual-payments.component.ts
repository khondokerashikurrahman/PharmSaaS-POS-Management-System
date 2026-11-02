import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface ManualPayment {
  paymentReference: string;
  registrationReference: string;
  pharmacyName: string;
  ownerName: string;
  email: string;
  paymentMethod: string;
  senderNumber: string;
  transactionId: string;
  amount: number;
  currency: string;
  planName: string;
  status: string;
}

@Component({
  selector: 'app-manual-payments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manual-payments.component.html',
  styleUrl: './manual-payments.component.scss'
})
export class ManualPaymentsComponent implements OnInit {
  payments: ManualPayment[] = [];
  loading = false;
  processingReference = '';
  errorMessage = '';
  successMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadPayments();
  }

  loadPayments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<ManualPayment[]>('/super-admin/manual-payments/pending')
      .subscribe({
        next: result => {
          this.payments = result || [];
          this.loading = false;
        },
        error: error => {
          this.loading = false;
          this.errorMessage = error?.error?.detail ||
            error?.error?.message ||
            'Could not load pending payments. Check backend and your Super Admin login.';
        }
      });
  }

  verify(payment: ManualPayment): void {
    const confirmed = confirm(
      `Have you checked the merchant account statement and confirmed this payment?\n\n` +
      `Pharmacy: ${payment.pharmacyName}\n` +
      `Method: ${payment.paymentMethod}\n` +
      `TrxID: ${payment.transactionId}\n` +
      `Amount: ${payment.currency} ${payment.amount}`
    );

    if (!confirmed) return;

    this.processingReference = payment.paymentReference;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.post<void>(
      `/super-admin/manual-payments/${encodeURIComponent(payment.paymentReference)}/verify`,
      {}
    ).subscribe({
      next: () => {
        this.processingReference = '';
        this.successMessage = `Payment verified for ${payment.pharmacyName}. Registration has been submitted for tenant approval.`;
        this.loadPayments();
      },
      error: error => {
        this.processingReference = '';
        this.errorMessage = error?.error?.detail ||
          error?.error?.message ||
          'Payment verification failed. Please check the backend response.';
      }
    });
  }

  reject(payment: ManualPayment): void {
    const reason = prompt(
      `Enter the rejection reason for ${payment.pharmacyName}:`
    );

    if (reason === null) return;

    if (!reason.trim()) {
      this.errorMessage = 'A rejection reason is required.';
      return;
    }

    this.processingReference = payment.paymentReference;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.post<void>(
      `/super-admin/manual-payments/${encodeURIComponent(payment.paymentReference)}/reject`,
      { reason: reason.trim() }
    ).subscribe({
      next: () => {
        this.processingReference = '';
        this.successMessage = `Payment submission for ${payment.pharmacyName} was rejected.`;
        this.loadPayments();
      },
      error: error => {
        this.processingReference = '';
        this.errorMessage = error?.error?.detail ||
          error?.error?.message ||
          'Payment rejection failed. Please try again.';
      }
    });
  }

  trackByReference(index: number, payment: ManualPayment): string {
    return payment.paymentReference;
  }
}
