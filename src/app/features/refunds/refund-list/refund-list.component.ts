import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  RefundApiService,
  RefundPaymentMethod,
  RefundResponse
} from '../../../core/services/refund-api.service';
import {
  SaleApiService,
  SaleReturnResponse
} from '../../../core/services/sale-api.service';

@Component({
  selector: 'app-refund-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './refund-list.component.html',
  styleUrl: './refund-list.component.scss'
})
export class RefundListComponent implements OnInit {
  private readonly refundApi = inject(RefundApiService);
  private readonly saleApi = inject(SaleApiService);

  refunds: RefundResponse[] = [];
  returns: SaleReturnResponse[] = [];

  loading = false;
  saving = false;
  loadError = '';
  successMessage = '';
  searchTerm = '';
  selectedStatus = 'ALL';
  showCreateForm = false;

  selectedReturnId: number | null = null;
  amount: number | null = null;
  paymentMethod: RefundPaymentMethod = 'CASH';
  transactionReference = '';
  notes = '';

  ngOnInit(): void {
    this.loadData();
  }

  get filteredRefunds(): RefundResponse[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.refunds.filter(refund => {
      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        refund.status.toUpperCase() === this.selectedStatus;

      const matchesSearch =
        !term ||
        (refund.refundNumber || '').toLowerCase().includes(term) ||
        String(refund.saleReturnId).includes(term) ||
        String(refund.id).includes(term) ||
        (refund.paymentMethod || '').toLowerCase().includes(term);

      return matchesStatus && matchesSearch;
    });
  }

  get pendingCount(): number {
    return this.refunds.filter(r => r.status === 'PENDING').length;
  }

  get completedCount(): number {
    return this.refunds.filter(r => r.status === 'COMPLETED').length;
  }

  get failedCount(): number {
    return this.refunds.filter(r => r.status === 'FAILED').length;
  }

  get totalPendingAmount(): number {
    return this.refunds
      .filter(r => r.status === 'PENDING')
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  }

  loadData(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.loadError = 'Tenant information is missing. Please log in again.';
      return;
    }

    this.loading = true;
    this.loadError = '';

    this.refundApi.listRefunds(tenantId).subscribe({
      next: result => {
        this.refunds = (Array.isArray(result) ? result : [])
          .sort((a, b) => b.id - a.id);
        this.loading = false;
      },
      error: error => {
        this.loadError = this.errorMessage(error, 'Refund records could not be loaded.');
        this.loading = false;
      }
    });

    this.saleApi.listReturns(tenantId).subscribe({
      next: result => {
        this.returns = (Array.isArray(result) ? result : []);
      },
      error: error => {
        console.error('Could not load sale returns for refund creation:', error);
      }
    });
  }

  openCreateForm(): void {
    this.showCreateForm = true;
    this.successMessage = '';
    this.loadError = '';
    this.selectedReturnId = null;
    this.amount = null;
    this.paymentMethod = 'CASH';
    this.transactionReference = '';
    this.notes = '';
  }

  closeCreateForm(): void {
    this.showCreateForm = false;
  }

  onReturnSelected(): void {
    const selected = this.returns.find(r => r.id === Number(this.selectedReturnId));
    this.amount = selected ? Number(selected.refundAmount) : null;
  }

  createRefund(): void {
    const tenantId = this.getTenantId();

    if (!tenantId || !this.selectedReturnId || !this.amount || this.amount <= 0) {
      this.loadError = 'Select a sale return and enter a valid refund amount.';
      return;
    }

    if (this.amount > 999999999) {
      this.loadError = 'Please enter a valid refund amount.';
      return;
    }

    this.saving = true;
    this.loadError = '';

    const request = {
      requestKey: `refund-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      amount: Number(this.amount),
      paymentMethod: this.paymentMethod,
      transactionReference: this.transactionReference.trim() || undefined,
      notes: this.notes.trim() || undefined
    };

    this.refundApi.createRefund(
      tenantId,
      Number(this.selectedReturnId),
      request
    ).subscribe({
      next: response => {
        this.saving = false;
        this.showCreateForm = false;
        this.successMessage = `Refund ${response.refundNumber} created successfully.`;
        this.loadData();
      },
      error: error => {
        this.saving = false;
        this.loadError = this.errorMessage(error, 'Refund could not be created.');
      }
    });
  }

  completeRefund(refund: RefundResponse): void {
    if (refund.status !== 'PENDING') return;

    const transactionReference =
      refund.paymentMethod === 'CASH'
        ? ''
        : prompt('Enter the payment transaction/reference number:');

    if (refund.paymentMethod !== 'CASH' && !transactionReference?.trim()) {
      return;
    }

    const confirmed = confirm(
      `Mark ${refund.refundNumber} as completed?\n\n` +
      'This records the refund as completed. It does not transfer money through a payment gateway.'
    );

    if (!confirmed) return;

    this.processRefund(refund, 'complete', {
      transactionReference: transactionReference?.trim() || undefined,
      notes: undefined
    });
  }

  failRefund(refund: RefundResponse): void {
    if (refund.status !== 'PENDING') return;

    const reason = prompt('Enter the reason for failing this refund:');
    if (reason === null) return;

    this.processRefund(refund, 'fail', {
      notes: reason.trim() || undefined
    });
  }

  private processRefund(
    refund: RefundResponse,
    action: 'complete' | 'fail',
    request: { transactionReference?: string; notes?: string }
  ): void {
    const tenantId = this.getTenantId();
    if (!tenantId) return;

    this.saving = true;
    this.loadError = '';
    this.successMessage = '';

    const operation = action === 'complete'
      ? this.refundApi.completeRefund(tenantId, refund.id, request)
      : this.refundApi.failRefund(tenantId, refund.id, request);

    operation.subscribe({
      next: response => {
        this.saving = false;
        this.successMessage =
          `${response.refundNumber} marked as ${response.status.toLowerCase()}.`;
        this.loadData();
      },
      error: error => {
        this.saving = false;
        this.loadError = this.errorMessage(error, 'Refund could not be processed.');
      }
    });
  }

  statusClass(status: string): string {
    return (status || '').toLowerCase();
  }

  formatDate(value: string | null): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleString('en-GB');
  }

  formatAmount(value: number): string {
    return Number(value || 0).toLocaleString('en-BD', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  refresh(): void {
    this.loadData();
  }

  private errorMessage(error: any, fallback: string): string {
    return error?.error?.detail ||
      error?.error?.message ||
      error?.error?.title ||
      fallback;
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
}
