import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface BillingRecord {
  paymentId: number;
  transactionReference: string;
  gatewayName: string;
  gatewayTransactionId: string | null;
  amount: number;
  currency: string;
  paymentStatus: string;
  paymentDate: string;
  verifiedAt: string | null;
  reviewedAt: string | null;
  planName: string;
  subscriptionStatus: string;
  subscriptionStartsAt: string;
  subscriptionEndsAt: string;
}

@Component({
  selector: 'app-billing-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './billing-history.component.html',
  styleUrl: './billing-history.component.scss'
})
export class BillingHistoryComponent implements OnInit {
  records: BillingRecord[] = [];
  loading = false;
  errorMessage = '';
  searchTerm = '';
  statusFilter = 'ALL';

  constructor(
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadHistory();
  }

  private getTenantId(): number | null {
    const userTenantId = this.auth.getCurrentUser()?.tenantId;
    const storedTenantId = localStorage.getItem('tenantId');
    const id = Number(userTenantId || storedTenantId);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  loadHistory(): void {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করুন।';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.api.get<BillingRecord[]>(
      `/tenants/${tenantId}/billing-history`
    ).subscribe({
      next: response => {
        this.records = Array.isArray(response) ? response : [];
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.errorMessage = error?.error?.detail ||
          error?.error?.message || 'Billing History লোড করা যায়নি।';
      }
    });
  }

  get filteredRecords(): BillingRecord[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.records.filter(record => {
      const matchesSearch = !term ||
        (record.transactionReference || '').toLowerCase().includes(term) ||
        (record.gatewayTransactionId || '').toLowerCase().includes(term) ||
        (record.planName || '').toLowerCase().includes(term);

      const matchesStatus = this.statusFilter === 'ALL' ||
        (record.paymentStatus || '').toUpperCase() === this.statusFilter;

      return matchesSearch && matchesStatus;
    });
  }

  get totalPaid(): number {
    return this.records
      .filter(record => (record.paymentStatus || '').toUpperCase() === 'VALIDATED')
      .reduce((sum, record) => sum + Number(record.amount || 0), 0);
  }

  get successfulCount(): number {
    return this.records.filter(
      record => (record.paymentStatus || '').toUpperCase() === 'VALIDATED'
    ).length;
  }

  statusClass(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'VALIDATED': return 'status-success';
      case 'PENDING_VERIFICATION':
      case 'INITIATED': return 'status-pending';
      case 'REJECTED':
      case 'FAILED':
      case 'VALIDATION_FAILED': return 'status-failed';
      default: return 'status-neutral';
    }
  }
}
