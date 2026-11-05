import { Component, OnInit } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  dashboard: DashboardResponse | null = null;
  loading = false;
  errorMessage = '';
  downloadingReport = false;
  reportStartDate = '';
  reportEndDate = '';

  constructor(private api: ApiService) {
    const now = new Date();
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    this.reportStartDate = formatDate(
      new Date(now.getFullYear(), now.getMonth(), 1)
    );
    this.reportEndDate = formatDate(now);
  }

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

  downloadPlatformReport(): void {
    if (!this.reportStartDate || !this.reportEndDate ||
        this.reportStartDate > this.reportEndDate) {
      this.errorMessage = 'Please select a valid report date range.';
      return;
    }

    this.downloadingReport = true;
    this.errorMessage = '';

    const params = new HttpParams()
      .set('startDate', this.reportStartDate)
      .set('endDate', this.reportEndDate);

    this.api.getBlob(
      '/super-admin/reports/platform-summary/pdf',
      params
    ).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pharmsaas-platform-summary-${this.reportStartDate}-to-${this.reportEndDate}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.downloadingReport = false;
      },
      error: (error) => {
        console.error('Platform report download error:', error);
        this.errorMessage =
          error.status === 401 ? 'Please login again.' :
          error.status === 403 ? 'Super Admin permission required.' :
          'Unable to download platform report. Please try again.';
        this.downloadingReport = false;
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
