import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface BackendSubscription {
  id: number;
  tenantId: number;
  tenantCode: string | null;
  tenantName: string | null;
  ownerName: string | null;
  email: string | null;
  planId: number;
  planCode: string | null;
  planName: string | null;
  amount: number;
  currency: string;
  durationDays: number;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  autoRenew: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

interface Subscription {
  id: string;
  backendId: number;
  tenantId: string;
  pharmacyName: string;
  owner: string;
  plan: string;
  billingCycle: string;
  amount: number;
  currency: string;
  startDate: string;
  nextBillingDate: string;
  status: string;
  autoRenew: boolean;
  durationDays: number;
}

@Component({
  selector: 'app-subscription-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './subscription-list.component.html',
  styleUrl: './subscription-list.component.scss'
})
export class SubscriptionListComponent implements OnInit {
  subscriptions: Subscription[] = [];
  filteredSubscriptions: Subscription[] = [];
  selectedFilter = 'All';
  searchText = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<BackendSubscription[]>('/super-admin/subscriptions').subscribe({
      next: (items) => {
        this.subscriptions = (items || []).map(item => this.mapSubscription(item));
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load subscriptions', error);
        this.errorMessage = error?.error?.message || 'Subscriptions could not be loaded from the server.';
        this.subscriptions = [];
        this.filteredSubscriptions = [];
        this.loading = false;
      }
    });
  }

  private mapSubscription(item: BackendSubscription): Subscription {
    return {
      id: `SUB-${item.id}`,
      backendId: item.id,
      tenantId: item.tenantCode || `TEN-${item.tenantId}`,
      pharmacyName: item.tenantName || 'Unnamed tenant',
      owner: item.ownerName || item.email || 'Not available',
      plan: item.planName || item.planCode || 'Unassigned',
      billingCycle: `${item.durationDays} days`,
      amount: Number(item.amount || 0),
      currency: item.currency || 'BDT',
      startDate: item.startsAt || '',
      nextBillingDate: item.endsAt || '',
      status: this.normalizeStatus(item.status),
      autoRenew: item.autoRenew,
      durationDays: item.durationDays
    };
  }

  private normalizeStatus(status: string): string {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE': return 'Active';
      case 'PENDING_APPROVAL': return 'Pending Approval';
      case 'CANCELLED': return 'Cancelled';
      case 'EXPIRED': return 'Expired';
      default: return status || 'Unknown';
    }
  }

  get totalSubscriptions(): number {
    return this.subscriptions.length;
  }

  get activeSubscriptions(): number {
    return this.subscriptions.filter(item => item.status === 'Active').length;
  }

  get trialSubscriptions(): number {
    return this.subscriptions.filter(item => item.status === 'Pending Approval').length;
  }

  get cancelledSubscriptions(): number {
    return this.subscriptions.filter(item => item.status === 'Cancelled').length;
  }

  get monthlyRecurringRevenue(): number {
    return this.subscriptions
      .filter(item => item.status === 'Active')
      .reduce((total, item) => total + item.amount, 0);
  }

  filterSubscriptions(status: string): void {
    this.selectedFilter = status;
    this.applyFilters();
  }

  searchSubscriptions(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let result = [...this.subscriptions];

    if (this.selectedFilter !== 'All') {
      result = result.filter(item => item.status === this.selectedFilter);
    }

    const search = this.searchText.trim().toLowerCase();
    if (search) {
      result = result.filter(item =>
        item.pharmacyName.toLowerCase().includes(search) ||
        item.owner.toLowerCase().includes(search) ||
        item.id.toLowerCase().includes(search) ||
        item.tenantId.toLowerCase().includes(search) ||
        item.plan.toLowerCase().includes(search)
      );
    }

    this.filteredSubscriptions = result;
  }

  viewSubscription(subscription: Subscription): void {
    alert(
      `Subscription: ${subscription.id}\n` +
      `Pharmacy: ${subscription.pharmacyName}\n` +
      `Owner: ${subscription.owner}\n` +
      `Plan: ${subscription.plan}\n` +
      `Amount: ${subscription.currency} ${subscription.amount}\n` +
      `Duration: ${subscription.durationDays} days\n` +
      `Status: ${subscription.status}\n` +
      `Expiry: ${subscription.nextBillingDate || 'Not set'}`
    );
  }

  cancelSubscription(subscription: Subscription): void {
    if (subscription.status !== 'Active') return;

    const confirmed = confirm(
      `Are you sure you want to cancel the subscription for ${subscription.pharmacyName}?`
    );
    if (!confirmed) return;

    this.successMessage = '';
    this.errorMessage = '';

    this.api.post(`/super-admin/subscriptions/${subscription.backendId}/cancel`, {}).subscribe({
      next: () => {
        this.successMessage = 'Subscription cancelled successfully.';
        this.loadSubscriptions();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Subscription cancellation failed.';
      }
    });
  }

  activateSubscription(subscription: Subscription): void {
    if (subscription.status !== 'Cancelled') return;

    const confirmed = confirm(
      `Reactivate the subscription for ${subscription.pharmacyName}?`
    );
    if (!confirmed) return;

    this.successMessage = '';
    this.errorMessage = '';

    this.api.post(`/super-admin/subscriptions/${subscription.backendId}/reactivate`, {}).subscribe({
      next: () => {
        this.successMessage = 'Subscription reactivated successfully.';
        this.loadSubscriptions();
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Subscription reactivation failed.';
      }
    });
  }
}
