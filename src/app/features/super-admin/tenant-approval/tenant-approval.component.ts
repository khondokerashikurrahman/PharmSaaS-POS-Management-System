import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  Tenant,
  TenantService
} from '../../../core/services/tenant.service';

@Component({
  selector: 'app-tenant-approval',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './tenant-approval.component.html',
  styleUrl: './tenant-approval.component.scss'
})
export class TenantApprovalComponent implements OnInit {

  tenants: Tenant[] = [];

  searchTerm = '';

  selectedTenant: Tenant | null = null;

  showRejectModal = false;

  rejectionReason = '';

  constructor(
    private router: Router,
    private tenantService: TenantService
  ) {}

  ngOnInit(): void {
    this.loadTenants();
  }

  /**
   * Always load the tenant list from the backend.
   */
  private loadTenants(): void {
    this.tenantService.loadTenants().subscribe({
      next: tenants => {
        this.tenants = tenants;
      },
      error: error => {
        console.error('Failed to load tenants from backend:', error);
        alert('Could not load tenants. Please check the backend and try again.');
      }
    });
  }

  // ==============================
  // PENDING TENANTS
  // ==============================

  get filteredTenants(): Tenant[] {

    const search =
      this.searchTerm
        .toLowerCase()
        .trim();

    return this.tenants.filter(tenant => {

      if (tenant.status !== 'Pending') {
        return false;
      }

      if (!search) {
        return true;
      }

      return (
        tenant.name
          .toLowerCase()
          .includes(search) ||

        tenant.owner
          .toLowerCase()
          .includes(search) ||

        tenant.email
          .toLowerCase()
          .includes(search) ||

        tenant.id
          .toLowerCase()
          .includes(search)
      );
    });
  }

  // ==============================
  // COUNTS
  // ==============================

  get pendingCount(): number {

    return this.tenants.filter(
      tenant =>
        tenant.status === 'Pending'
    ).length;
  }

  get approvedCount(): number {

    return this.tenants.filter(
      tenant =>
        tenant.status === 'Active'
    ).length;
  }

  get rejectedCount(): number {

    return this.tenants.filter(
      tenant =>
        tenant.status === 'Rejected'
    ).length;
  }

  // ==============================
  // VIEW TENANT
  // ==============================

  viewTenant(tenant: Tenant): void {

    this.router.navigate(
      ['/admin/tenant-details'],
      {
        state: {
          tenant: tenant
        }
      }
    );
  }

  // ==============================
  // APPROVE TENANT
  // ==============================

  approveTenant(tenant: Tenant): void {
    const confirmed = confirm(
      `Are you sure you want to approve ${tenant.name}?`
    );

    if (!confirmed) {
      return;
    }

    this.tenantService.approveTenantOnBackend(tenant.id).subscribe({
      next: updated => {
        this.tenants = this.tenantService.getTenants();
        alert(`${updated.name} has been approved successfully.`);
      },
      error: error => {
        console.error('Tenant approval failed:', error);
        alert('Tenant approval failed. Please check the backend response and try again.');
      }
    });
  }

  // ==============================
  // OPEN REJECT MODAL
  // ==============================

  openRejectModal(tenant: Tenant): void {

    this.selectedTenant = tenant;

    this.rejectionReason = '';

    this.showRejectModal = true;
  }

  // ==============================
  // CLOSE REJECT MODAL
  // ==============================

  closeRejectModal(): void {

    this.showRejectModal = false;

    this.selectedTenant = null;

    this.rejectionReason = '';
  }

  // ==============================
  // REJECT TENANT
  // ==============================

  rejectTenant(): void {
    if (!this.selectedTenant) {
      return;
    }

    const reason = this.rejectionReason.trim();

    if (!reason) {
      alert('Please enter a reason for rejection.');
      return;
    }

    const tenantName = this.selectedTenant.name;

    this.tenantService
      .rejectTenantOnBackend(this.selectedTenant.id, reason)
      .subscribe({
        next: updated => {
          this.tenants = this.tenantService.getTenants();
          this.closeRejectModal();
          alert(`${updated.name || tenantName} has been rejected.`);
        },
        error: error => {
          console.error('Tenant rejection failed:', error);
          alert('Tenant rejection failed. Please check the backend response and try again.');
        }
      });
  }

  // ==============================
  // BACK TO TENANT LIST
  // ==============================

  goBack(): void {

    this.router.navigate(
      ['/admin/tenants']
    );
  }

}