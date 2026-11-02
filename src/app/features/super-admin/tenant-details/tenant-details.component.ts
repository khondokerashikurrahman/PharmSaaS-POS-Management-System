import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface TenantData {
  id: number;
  tenantCode: string;
  name: string;
  ownerName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  rejectionReason?: string | null;
}

interface SubscriptionData {
  id: number;
  tenantId: number;
  planName: string;
  amount: number;
  currency: string;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  autoRenew: boolean;
  createdAt: string | null;
}

interface ActivityData {
  id: number;
  actorName: string;
  action: string;
  module: string;
  targetType: string;
  targetId: string;
  description: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-tenant-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-details.component.html',
  styleUrl: './tenant-details.component.scss'
})
export class TenantDetailsComponent implements OnInit {
  tenant: TenantData | null = null;
  subscription: SubscriptionData | null = null;
  activities: ActivityData[] = [];
  loading = true;
  saving = false;
  actionLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const queryId = params.get('id');
      const stateId = history.state?.tenant?.id;
      const id = queryId || stateId;

      if (!id || !/^\d+$/.test(String(id))) {
        this.loading = false;
        this.errorMessage = 'Tenant ID পাওয়া যায়নি। Tenant List থেকে আবার Details খুলুন।';
        return;
      }

      this.loadTenant(Number(id));
    });
  }

  loadTenant(id: number): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<TenantData>(`/tenants/${id}`).subscribe({
      next: tenant => {
        this.tenant = tenant;
        this.loading = false;
        this.loadSubscription(id);
        this.loadActivities(id);
      },
      error: error => {
        this.errorMessage = error?.error?.message || 'Tenant details load করা যায়নি।';
        this.loading = false;
      }
    });
  }

  private loadSubscription(tenantId: number): void {
    this.api.get<SubscriptionData[]>('/super-admin/subscriptions').subscribe({
      next: rows => {
        this.subscription = rows
          .filter(row => Number(row.tenantId) === tenantId)
          .sort((a, b) =>
            new Date(b.createdAt || b.startsAt || 0).getTime() -
            new Date(a.createdAt || a.startsAt || 0).getTime()
          )[0] ?? null;
      },
      error: error => console.error('Subscription load failed:', error)
    });
  }

  private loadActivities(tenantId: number): void {
    this.api.get<ActivityData[]>('/super-admin/audit-logs').subscribe({
      next: rows => {
        this.activities = rows
          .filter(row =>
            row.targetType?.toLowerCase() === 'tenant' &&
            String(row.targetId) === String(tenantId)
          )
          .slice(0, 8);
      },
      error: error => console.error('Tenant activity load failed:', error)
    });
  }

  get statusLabel(): string {
    const status = this.tenant?.status?.toLowerCase();
    if (status === 'active') return 'Active';
    if (status === 'suspended') return 'Suspended';
    if (status === 'rejected') return 'Rejected';
    if (status === 'archived') return 'Archived';
    return 'Pending';
  }

  get planName(): string {
    return this.subscription?.planName ?? 'No subscription';
  }

  get monthlyBilling(): number | null {
    return this.subscription?.amount ?? null;
  }

  get registrationDate(): string {
    return this.formatDate(this.tenant?.createdAt);
  }

  get subscriptionStart(): string {
    return this.formatDate(this.subscription?.startsAt);
  }

  get subscriptionEnd(): string {
    return this.formatDate(this.subscription?.endsAt);
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? '—'
      : date.toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric'
        });
  }

  formatAction(value: string): string {
    return (value || '').replaceAll('_', ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  goBack(): void {
    this.router.navigate(['/admin/tenants']);
  }

  editTenant(): void {
    if (!this.tenant || this.saving) return;

    const name = window.prompt('Business Name', this.tenant.name);
    if (name === null) return;
    const ownerName = window.prompt('Owner Name', this.tenant.ownerName || '');
    if (ownerName === null) return;
    const email = window.prompt('Email Address', this.tenant.email || '');
    if (email === null) return;
    const phone = window.prompt('Phone Number', this.tenant.phone || '');
    if (phone === null) return;
    const address = window.prompt('Business Address', this.tenant.address || '');
    if (address === null) return;

    if (!name.trim()) {
      this.errorMessage = 'Business name is required.';
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.api.put<TenantData>(`/tenants/${this.tenant.id}`, {
      tenantCode: this.tenant.tenantCode,
      name: name.trim(),
      ownerName: ownerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim()
    }).subscribe({
      next: updated => {
        this.tenant = updated;
        this.successMessage = 'Tenant profile updated successfully.';
        this.saving = false;
      },
      error: error => {
        this.errorMessage = error?.error?.message || 'Tenant profile update failed.';
        this.saving = false;
      }
    });
  }

  changeStatus(): void {
    if (!this.tenant || this.actionLoading) return;

    const status = this.tenant.status.toLowerCase();
    let endpoint = '';
    let action = '';

    if (status === 'active') {
      endpoint = `/tenants/${this.tenant.id}/suspend`;
      action = 'suspend';
    } else if (status === 'suspended') {
      endpoint = `/tenants/${this.tenant.id}/activate`;
      action = 'activate';
    } else if (status === 'pending' || status === 'approved') {
      endpoint = `/tenants/${this.tenant.id}/approve`;
      action = 'approve';
    } else {
      this.errorMessage = 'এই Tenant-এর বর্তমান status থেকে action করা যাবে না।';
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${this.tenant.name}?`)) return;

    this.actionLoading = true;
    this.errorMessage = '';

    this.api.post<TenantData>(endpoint, {}).subscribe({
      next: updated => {
        this.tenant = updated;
        this.successMessage = `Tenant ${action} successful.`;
        this.actionLoading = false;
      },
      error: error => {
        this.errorMessage = error?.error?.message || `Tenant ${action} failed.`;
        this.actionLoading = false;
      }
    });
  }

  get canChangeStatus(): boolean {
    return ['active', 'suspended', 'pending', 'approved']
      .includes(this.tenant?.status?.toLowerCase() || '');
  }
}
