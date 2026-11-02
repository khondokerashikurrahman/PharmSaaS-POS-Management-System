import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface TenantSubscription {
  subscriptionId: number;
  subscriptionStatus: string;
  startsAt: string;
  endsAt: string;
  autoRenew: boolean;
  planId: number;
  planCode: string;
  planName: string;
  planDescription: string | null;
  planPrice: number;
  currency: string;
  durationDays: number;
  createdAt: string;
}

@Component({
  selector: 'app-saas-plan',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saas-plan.component.html',
  styleUrl: './saas-plan.component.scss'
})
export class SaasPlanComponent implements OnInit {
  subscription: TenantSubscription | null = null;
  loading = false;
  errorMessage = '';
  loaded = false;

  constructor(
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSubscription();
  }

  private getTenantId(): number | null {
    const userTenantId = this.auth.getCurrentUser()?.tenantId;
    const storedTenantId = localStorage.getItem('tenantId');
    const id = Number(userTenantId || storedTenantId);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  loadSubscription(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করুন।';
      this.loaded = true;
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.api.get<TenantSubscription | null>(
      `/tenants/${tenantId}/subscription`
    ).subscribe({
      next: response => {
        this.subscription = response || null;
        this.loading = false;
        this.loaded = true;
      },
      error: error => {
        this.loading = false;
        this.loaded = true;
        this.errorMessage = error?.error?.detail ||
          error?.error?.message ||
          'Subscription তথ্য লোড করা যায়নি।';
      }
    });
  }

  get daysRemaining(): number {
    if (!this.subscription?.endsAt) return 0;
    const remaining = new Date(this.subscription.endsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 86400000));
  }

  get statusClass(): string {
    const status = (this.subscription?.subscriptionStatus || '').toUpperCase();
    if (status === 'ACTIVE') return 'status-active';
    if (status === 'PENDING_APPROVAL') return 'status-pending';
    if (status === 'CANCELLED') return 'status-cancelled';
    if (status === 'EXPIRED') return 'status-expired';
    return 'status-neutral';
  }

  formatStatus(status: string): string {
    return (status || 'UNKNOWN').replace(/_/g, ' ');
  }
}
