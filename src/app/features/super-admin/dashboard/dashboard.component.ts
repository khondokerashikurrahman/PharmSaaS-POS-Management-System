import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface DashboardResponse {
  totalTenants: number;
  activeTenants: number;
  pendingTenants: number;
  suspendedTenants: number;
  activeSubscriptions: number;
  expiringSubscriptions: number;
  monthlyRevenue: number;
  currency: string;
  recentTenants: {
    id: number;
    pharmacy: string;
    owner: string;
    status: string;
    createdAt: string;
  }[];
  recentPayments: {
    id: number;
    reference: string;
    pharmacy: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }[];
  planDistribution: {
    planId: number;
    plan: string;
    activeSubscriptions: number;
  }[];
}

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  dashboard: DashboardResponse | null = null;
  loading = false;
  errorMessage = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.refreshDashboard();
  }

  refreshDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<DashboardResponse>('/super-admin/dashboard')
      .subscribe({
        next: (response) => {
          this.dashboard = response;
          this.loading = false;
        },
        error: (error) => {
          console.error('Dashboard API error:', error);
          this.errorMessage =
            error.status === 403
              ? 'Super Admin permission required.'
              : error.status === 401
                ? 'Please login again.'
                : 'Unable to load platform dashboard. Please try again.';
          this.loading = false;
        }
      });
  }

  get stats() {
    if (!this.dashboard) return [];

    return [
      {
        title: 'Total Tenants',
        value: this.dashboard.totalTenants,
        icon: '🏪',
        change: `${this.dashboard.activeTenants} Active`,
        label: `${this.dashboard.pendingTenants} Pending`
      },
      {
        title: 'Active Subscriptions',
        value: this.dashboard.activeSubscriptions,
        icon: '💳',
        change: `${this.dashboard.expiringSubscriptions} Expiring`,
        label: 'within next 30 days'
      },
      {
        title: 'Monthly Revenue',
        value: this.formatCurrency(this.dashboard.monthlyRevenue),
        icon: '💰',
        change: 'Verified payments',
        label: 'Current month'
      },
      {
        title: 'Expiring Soon',
        value: this.dashboard.expiringSubscriptions,
        icon: '⚠️',
        change: 'Next 30 days',
        label: 'Active subscriptions'
      }
    ];
  }

  get maxPlanCount(): number {
    return Math.max(
      1,
      ...(this.dashboard?.planDistribution.map(
        item => item.activeSubscriptions
      ) ?? [])
    );
  }

  formatCurrency(amount: number, currency = 'BDT'): string {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(amount ?? 0);
  }
}
