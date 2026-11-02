
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';

import {
  Tenant,
  TenantService
} from '../../../core/services/tenant.service';

@Component({
  selector: 'app-tenant-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tenant-list.component.html',
  styleUrl: './tenant-list.component.scss'
})
export class TenantListComponent implements OnInit, OnDestroy {
  tenants: Tenant[] = [];

  searchTerm = '';
  selectedStatus = '';
  showArchived = false;

  showViewModal = false;
  showRejectModal = false;
  rejectionReason = '';
  rejecting = false;

  selectedTenant: Tenant | null = null;

  loading = false;
  errorMessage = '';

  private refreshSubscription?: Subscription;


  constructor(
    private readonly router: Router,
    private readonly tenantService: TenantService
  ) {}

  ngOnInit(): void {
    this.loadTenants();

    // Refresh the list every 15 seconds.
    this.refreshSubscription = interval(15000).subscribe(() => {
      this.loadTenants(true);
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  private loadTenants(silent = false): void {
    if (!silent) {
      this.loading = true;
      this.errorMessage = '';
    }

    this.tenantService.loadTenants(this.showArchived).subscribe({
      next: tenants => {
        this.tenants = tenants;
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.errorMessage =
          'Tenant data could not be loaded from the backend. Check that the backend is running and the API URL is correct.';

        console.error('Failed to load tenants:', error);
      }
    });
  }

  get filteredTenants(): Tenant[] {
    const search = this.searchTerm.toLowerCase().trim();

    return this.tenants.filter(tenant => {
      const matchesSearch =
        !search ||
        (tenant.name ?? '').toLowerCase().includes(search) ||
        (tenant.owner ?? '').toLowerCase().includes(search) ||
        (tenant.email ?? '').toLowerCase().includes(search) ||
        String(tenant.id ?? '').toLowerCase().includes(search) ||
        (tenant.tenantCode ?? '').toLowerCase().includes(search);

      const matchesStatus =
        !this.selectedStatus ||
        tenant.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  get totalTenants(): number {
    return this.tenants.length;
  }

  get activeTenants(): number {
    return this.tenants.filter(t => t.status === 'Active').length;
  }

  get pendingTenants(): number {
    return this.tenants.filter(t => t.status === 'Pending').length;
  }

  get suspendedTenants(): number {
    return this.tenants.filter(t => t.status === 'Suspended').length;
  }

  get rejectedTenants(): number {
    return this.tenants.filter(t => t.status === 'Rejected').length;
  }

  get archivedTenants(): number {
    return this.tenants.filter(t => t.status === 'Archived').length;
  }

  toggleArchived(): void {
    this.showArchived = !this.showArchived;
    this.selectedStatus = '';
    this.loadTenants();
  }

  restoreTenant(tenant: Tenant): void {
    if (tenant.status !== 'Archived') {
      return;
    }

    if (!confirm(`Restore ${tenant.name}? It will return as Suspended.`)) {
      return;
    }

    this.tenantService.restoreTenantFromBackend(tenant.id).subscribe({
      next: updated => {
        this.replaceTenant(updated);
        alert(`${updated.name} has been restored as Suspended.`);
      },
      error: error => {
        console.error('Failed to restore tenant:', error);
        alert(error?.error?.message || 'Could not restore this tenant.');
        this.loadTenants(true);
      }
    });
  }


  openViewModal(tenant: Tenant): void {
    this.selectedTenant = tenant;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.selectedTenant = null;
  }

  viewTenant(tenant: Tenant): void {
    this.router.navigate(['/admin/tenant-details'], {
      queryParams: { id: tenant.id },
      state: { tenant }
    });
  }

  enterPharmacy(tenant: Tenant): void {
    alert('Super Admin cannot enter a tenant using the platform account. Please sign in with an authorized tenant member account.');
  }

  approveTenant(tenant: Tenant): void {
    if (tenant.status !== 'Pending') {
      alert('Only pending tenants can be approved.');
      return;
    }

    if (!confirm(`Are you sure you want to approve ${tenant.name}?`)) {
      return;
    }

    this.tenantService.approveTenantOnBackend(tenant.id).subscribe({
      next: updated => {
        this.replaceTenant(updated);
        alert(`${updated.name} has been approved successfully.`);
      },
      error: error => {
        console.error('Failed to approve tenant:', error);
        alert(error?.error?.message || 'Could not approve this tenant.');
        this.loadTenants();
      }
    });
  }

  rejectTenant(tenant: Tenant): void {
    console.log('[Reject clicked]', {
      id: tenant.id,
      name: tenant.name,
      status: tenant.status
    });

    if (tenant.status !== 'Pending') {
      alert('Only pending tenants can be rejected.');
      return;
    }

    this.selectedTenant = tenant;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  closeRejectModal(): void {
    if (this.rejecting) {
      return;
    }

    this.showRejectModal = false;
    this.selectedTenant = null;
    this.rejectionReason = '';
  }

  submitTenantRejection(): void {
    const tenant = this.selectedTenant;
    const reason = this.rejectionReason.trim();

    if (!tenant || this.rejecting) {
      return;
    }

    if (!reason) {
      alert('Please enter a reason for rejection.');
      return;
    }

    this.rejecting = true;

    this.tenantService.rejectTenantOnBackend(tenant.id, reason).subscribe({
      next: updated => {
        this.rejecting = false;
        this.showRejectModal = false;
        this.selectedTenant = null;
        this.rejectionReason = '';

        this.loadTenants(true);
        alert(`${updated.name || tenant.name} has been rejected successfully.`);
      },
      error: error => {
        this.rejecting = false;
        console.error('Failed to reject tenant:', error);
        alert('Could not reject this tenant. Check the backend response.');
      }
    });
  }

  suspendTenant(tenant: Tenant): void {
    if (tenant.status !== 'Active') {
      alert('Only active tenants can be suspended.');
      return;
    }

    if (!confirm(`Are you sure you want to suspend ${tenant.name}?`)) {
      return;
    }

    this.changeStatus(tenant, 'Suspended', 'suspended');
  }

  activateTenant(tenant: Tenant): void {
    if (tenant.status !== 'Suspended') {
      alert('This tenant cannot be activated from its current status.');
      return;
    }

    if (!confirm(`Are you sure you want to activate ${tenant.name}?`)) {
      return;
    }

    this.changeStatus(tenant, 'Active', 'activated');
  }

  private changeStatus(
    tenant: Tenant,
    status: string,
    action: string
  ): void {
    this.tenantService.updateTenantStatus(tenant, status).subscribe({
      next: updated => {
        this.replaceTenant(updated);
        alert(`${updated.name} has been ${action} successfully.`);
      },
      error: error => {
        console.error(`Failed to ${action} tenant:`, error);
        alert(
          `Could not ${action} this tenant. The backend rejected the request. Check the server response.`
        );
        this.loadTenants(true);
      }
    });
  }

  deleteTenant(tenant: Tenant): void {
    if (
      !confirm(`Archive ${tenant.name}? Its sales, invoices and financial history will be preserved.`)
    ) {
      return;
    }

    this.tenantService.deleteTenantFromBackend(tenant.id).subscribe({
      next: () => {
        this.tenants = this.tenants.filter(
          item => String(item.id) !== String(tenant.id)
        );

        if (
          this.selectedTenant &&
          String(this.selectedTenant.id) === String(tenant.id)
        ) {
          this.closeViewModal();
        }

        alert(`${tenant.name} has been archived. Business history has been preserved.`);
      },
      error: error => {
        console.error('Failed to delete tenant:', error);

        const message =
          error?.error?.message ||
          error?.message ||
          'Could not archive this tenant. Please try again.';

        alert(message);
      }
    });
  }


  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
  }

  refreshTenants(): void {
    this.loadTenants();
  }

  trackByTenantId(index: number, tenant: Tenant): string {
    return String(tenant.id);
  }

  private replaceTenant(updated: Tenant): void {
    this.tenants = this.tenants.map(tenant =>
      String(tenant.id) === String(updated.id) ? updated : tenant
    );

    if (
      this.selectedTenant &&
      String(this.selectedTenant.id) === String(updated.id)
    ) {
      this.selectedTenant = updated;
    }
  }
}
