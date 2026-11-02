import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface TenantUsage {
  activeBranches: number;
  activeTeamMembers: number;
  activeInventoryItems: number;
  inventoryBatches: number;
  planName: string | null;
  planCode: string | null;
  subscriptionStatus: string | null;
  subscriptionEndsAt: string | null;
  limitsConfigured: boolean;
  maxBranches: number | null;
  maxTeamMembers: number | null;
  maxInventoryItems: number | null;
  maxInventoryBatches: number | null;
}

@Component({
  selector: 'app-usage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usage.component.html',
  styleUrl: './usage.component.scss'
})
export class UsageComponent implements OnInit {
  usage: TenantUsage | null = null;
  loading = false;
  loaded = false;
  errorMessage = '';

  constructor(
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUsage();
  }

  private getTenantId(): number | null {
    const userTenantId = this.auth.getCurrentUser()?.tenantId;
    const storedTenantId = localStorage.getItem('tenantId');
    const id = Number(userTenantId || storedTenantId);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  loadUsage(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করুন।';
      this.loaded = true;
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.api.get<TenantUsage>(`/tenants/${tenantId}/usage`).subscribe({
      next: response => {
        this.usage = response;
        this.loading = false;
        this.loaded = true;
      },
      error: error => {
        this.errorMessage = error?.error?.detail ||
          error?.error?.message || 'Usage তথ্য লোড করা যায়নি।';
        this.loading = false;
        this.loaded = true;
      }
    });
  }

  get metrics() {
    if (!this.usage) return [];

    return [
      {
        label: 'Active Branches',
        value: this.usage.activeBranches,
        icon: 'bi-shop',
        description: 'Active stores registered under this pharmacy', limit: this.usage.maxBranches
      },
      {
        label: 'Active Team Members',
        value: this.usage.activeTeamMembers,
        icon: 'bi-people',
        description: 'Active tenant memberships, including owner and admins', limit: this.usage.maxTeamMembers
      },
      {
        label: 'Active Inventory Items',
        value: this.usage.activeInventoryItems,
        icon: 'bi-capsule',
        description: 'Active inventory products', limit: this.usage.maxInventoryItems
      },
      {
        label: 'Inventory Batches',
        value: this.usage.inventoryBatches,
        icon: 'bi-boxes',
        description: 'Recorded inventory batches', limit: this.usage.maxInventoryBatches
      }
    ];
  }

  limitLabel(limit: number | null): string {
    return limit === null || limit === undefined ? 'Not configured' : limit === -1 ? 'Unlimited' : String(limit);
  }

  usagePercent(value: number, limit: number | null): number | null {
    return limit == null || limit < 0 ? null : (limit === 0 ? 100 : Math.min(100, value / limit * 100));
  }

  formatStatus(status: string | null): string {
    return status ? status.replace(/_/g, ' ') : 'Not available';
  }
}
