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

interface BillingTransaction {
  id: string;
  tenantId: string;
  pharmacyName: string;
  owner: string;
  email: string;
  plan: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionDate: string;
  transactionId: string;
  registrationReference: string;
  status: 'Paid' | 'Pending' | 'Failed' | 'Rejected' | 'Cancelled' | 'Initiated' | 'Refunded';
  reviewNote: string;
  verifiedAt: string | null;
}

@Component({
  selector: 'app-billing-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './billing-transactions.component.html',
  styleUrl: './billing-transactions.component.scss'
})
export class BillingTransactionsComponent implements OnInit {
  transactions: BillingTransaction[] = [];
  filteredTransactions: BillingTransaction[] = [];
  selectedFilter = 'All';
  searchText = '';
  loading = false;
  errorMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<PaymentResponse[]>('/super-admin/billing-transactions')
      .subscribe({
        next: response => {
          this.transactions = (response || []).map(payment => ({
            id: payment.paymentReference,
            tenantId: payment.tenantId != null
              ? String(payment.tenantId)
              : payment.registrationReference,
            pharmacyName: payment.tenantName || 'Registration pending',
            owner: payment.ownerName || '—',
            email: payment.email || '',
            plan: payment.planName || '—',
            amount: Number(payment.amount || 0),
            currency: payment.currency || 'BDT',
            paymentMethod: this.formatPaymentMethod(payment.paymentMethod),
            transactionDate: payment.createdAt,
            transactionId: payment.transactionId || '—',
            registrationReference: payment.registrationReference,
            status: this.normalizeStatus(payment.status),
            reviewNote: payment.reviewNote || '',
            verifiedAt: payment.verifiedAt
          }));

          this.applyFilters();
          this.loading = false;
        },
        error: error => {
          this.loading = false;
          this.errorMessage = error?.error?.message ||
            'Unable to load billing transactions. Check your connection and access permissions.';
        }
      });
  }

  private normalizeStatus(status: string): BillingTransaction['status'] {
    switch ((status || '').toUpperCase()) {
      case 'VALIDATED':
        return 'Paid';
      case 'PENDING_VERIFICATION':
        return 'Pending';
      case 'INITIATED':
        return 'Initiated';
      case 'FAILED':
      case 'VALIDATION_FAILED':
        return 'Failed';
      case 'REJECTED':
        return 'Rejected';
      case 'CANCELLED':
        return 'Cancelled';
      case 'REFUNDED':
        return 'Refunded';
      default:
        return 'Initiated';
    }
  }

  private formatPaymentMethod(method: string): string {
    switch ((method || '').toUpperCase()) {
      case 'BKASH': return 'bKash';
      case 'NAGAD': return 'Nagad';
      case 'ROCKET': return 'Rocket';
      case 'BANK': return 'Bank Transfer';
      case 'SSLCOMMERZ': return 'SSLCOMMERZ';
      default: return method || 'Unknown';
    }
  }

  get totalTransactions(): number {
    return this.transactions.length;
  }

  get paidTransactions(): number {
    return this.transactions.filter(t => t.status === 'Paid').length;
  }

  get pendingTransactions(): number {
    return this.transactions.filter(t => t.status === 'Pending').length;
  }

  get totalRevenue(): number {
    return this.transactions
      .filter(t => t.status === 'Paid')
      .reduce((total, t) => total + t.amount, 0);
  }

  filterTransactions(status: string): void {
    this.selectedFilter = status;
    this.applyFilters();
  }

  searchTransactions(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = [...this.transactions];

    if (this.selectedFilter !== 'All') {
      result = result.filter(t => t.status === this.selectedFilter);
    }

    const search = this.searchText.trim().toLowerCase();

    if (search) {
      result = result.filter(t =>
        t.id.toLowerCase().includes(search) ||
        t.tenantId.toLowerCase().includes(search) ||
        t.pharmacyName.toLowerCase().includes(search) ||
        t.owner.toLowerCase().includes(search) ||
        t.email.toLowerCase().includes(search) ||
        t.plan.toLowerCase().includes(search) ||
        t.transactionId.toLowerCase().includes(search) ||
        t.paymentMethod.toLowerCase().includes(search)
      );
    }

    this.filteredTransactions = result;
  }

  viewTransaction(transaction: BillingTransaction): void {
    alert(
      `Payment Details\n\n` +
      `Reference: ${transaction.id}\n` +
      `Pharmacy: ${transaction.pharmacyName}\n` +
      `Owner: ${transaction.owner}\n` +
      `Email: ${transaction.email}\n` +
      `Registration: ${transaction.registrationReference}\n` +
      `Plan: ${transaction.plan}\n` +
      `Amount: ${transaction.currency} ${transaction.amount}\n` +
      `Payment Method: ${transaction.paymentMethod}\n` +
      `Gateway TrxID: ${transaction.transactionId}\n` +
      `Date: ${transaction.transactionDate}\n` +
      `Verified: ${transaction.verifiedAt || 'Not verified'}\n` +
      `Status: ${transaction.status}\n` +
      `Review Note: ${transaction.reviewNote || '—'}`
    );
  }
}
