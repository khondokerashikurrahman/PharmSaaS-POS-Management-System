import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface PaymentResponse {
  id: number;
  paymentReference: string;
  registrationReference: string;
  tenantId: number | null;
  tenantName: string;
  ownerName: string;
  email: string;
  planName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string | null;
  senderNumber: string | null;
  status: string;
  reviewNote: string | null;
  createdAt: string;
  verifiedAt: string | null;
  reviewedAt: string | null;
}

interface BillingLog {
  id: string;
  tenantId: string;
  pharmacyName: string;
  action: string;
  description: string;
  amount: number;
  currency: string;
  performedBy: string;
  date: string;
  status: 'Success' | 'Warning' | 'Failed' | 'Info';
  paymentReference: string;
  transactionId: string;
  paymentMethod: string;
  ownerName: string;
  email: string;
  planName: string;
  reviewNote: string;
}

@Component({
  selector: 'app-billing-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing-logs.component.html',
  styleUrl: './billing-logs.component.scss'
})
export class BillingLogsComponent implements OnInit {

  logs: BillingLog[] = [];
  filteredLogs: BillingLog[] = [];

  selectedFilter = 'All';
  searchText = '';

  loading = false;
  errorMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<PaymentResponse[]>('/super-admin/billing-transactions')
      .subscribe({
        next: (payments) => {
          this.logs = (payments || []).map(payment =>
            this.mapPaymentToLog(payment)
          );

          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Billing logs loading failed:', error);
          this.errorMessage =
            error?.error?.message ||
            'Unable to load billing activity. Please try again.';
          this.loading = false;
        }
      });
  }

  private mapPaymentToLog(payment: PaymentResponse): BillingLog {
    const status = (payment.status || '').toUpperCase();

    let action = 'Payment Activity';
    let logStatus: BillingLog['status'] = 'Info';

    switch (status) {
      case 'VALIDATED':
        action = 'Payment Verified';
        logStatus = 'Success';
        break;

      case 'PENDING_VERIFICATION':
        action = 'Payment Awaiting Verification';
        logStatus = 'Warning';
        break;

      case 'INITIATED':
        action = 'Payment Initiated';
        logStatus = 'Info';
        break;

      case 'FAILED':
      case 'VALIDATION_FAILED':
      case 'REJECTED':
        action = status === 'REJECTED'
          ? 'Payment Rejected'
          : 'Payment Failed';
        logStatus = 'Failed';
        break;

      case 'CANCELLED':
        action = 'Payment Cancelled';
        logStatus = 'Info';
        break;

      default:
        action = `Payment Status: ${status || 'Unknown'}`;
        logStatus = 'Info';
    }

    const eventDate =
      payment.verifiedAt ||
      payment.reviewedAt ||
      payment.createdAt;

    const description = payment.reviewNote?.trim()
      ? payment.reviewNote
      : `${payment.paymentMethod || 'Payment Gateway'} payment for ${payment.planName || 'subscription'} plan. Current payment status: ${status || 'Unknown'}.`;

    return {
      id: `PAY-${payment.id}`,
      tenantId: payment.tenantId
        ? `TEN-${payment.tenantId}`
        : payment.registrationReference || 'Registration pending',
      pharmacyName: payment.tenantName || 'Unknown Pharmacy',
      action,
      description,
      amount: Number(payment.amount || 0),
      currency: payment.currency || 'BDT',
      performedBy: 'Not recorded',
      date: eventDate || payment.createdAt,
      status: logStatus,
      paymentReference: payment.paymentReference || '',
      transactionId: payment.transactionId || '',
      paymentMethod: payment.paymentMethod || '',
      ownerName: payment.ownerName || '',
      email: payment.email || '',
      planName: payment.planName || '',
      reviewNote: payment.reviewNote || ''
    };
  }

  get totalLogs(): number {
    return this.logs.length;
  }

  get successfulLogs(): number {
    return this.logs.filter(log => log.status === 'Success').length;
  }

  get warningLogs(): number {
    return this.logs.filter(log => log.status === 'Warning').length;
  }

  get failedLogs(): number {
    return this.logs.filter(log => log.status === 'Failed').length;
  }

  filterLogs(status: string): void {
    this.selectedFilter = status;
    this.applyFilters();
  }

  searchLogs(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = [...this.logs];

    if (this.selectedFilter !== 'All') {
      result = result.filter(
        log => log.status === this.selectedFilter
      );
    }

    const search = this.searchText.trim().toLowerCase();

    if (search) {
      result = result.filter(log =>
        log.id.toLowerCase().includes(search) ||
        log.tenantId.toLowerCase().includes(search) ||
        log.pharmacyName.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search) ||
        log.description.toLowerCase().includes(search) ||
        log.performedBy.toLowerCase().includes(search) ||
        log.paymentReference.toLowerCase().includes(search) ||
        log.transactionId.toLowerCase().includes(search) ||
        log.ownerName.toLowerCase().includes(search) ||
        log.email.toLowerCase().includes(search)
      );
    }

    this.filteredLogs = result;
  }

  formatDate(value: string): string {
    if (!value) return '—';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString();
  }

  viewLog(log: BillingLog): void {
    alert(
      `Billing Activity Details\n\n` +
      `Payment ID: ${log.id}\n` +
      `Payment Reference: ${log.paymentReference}\n` +
      `Registration/Tenant: ${log.tenantId}\n` +
      `Pharmacy: ${log.pharmacyName}\n` +
      `Owner: ${log.ownerName}\n` +
      `Email: ${log.email}\n` +
      `Plan: ${log.planName}\n` +
      `Activity: ${log.action}\n` +
      `Description: ${log.description}\n` +
      `Amount: ${log.currency} ${log.amount}\n` +
      `Payment Method: ${log.paymentMethod}\n` +
      `Transaction ID: ${log.transactionId || '—'}\n` +
      `Performed By: ${log.performedBy}\n` +
      `Date: ${this.formatDate(log.date)}\n` +
      `Status: ${log.status}\n` +
      `Review Note: ${log.reviewNote || '—'}`
    );
  }
}
