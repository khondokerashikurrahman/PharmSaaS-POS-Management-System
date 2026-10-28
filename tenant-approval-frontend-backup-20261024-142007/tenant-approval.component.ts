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

    this.tenants =
      this.tenantService.getTenants();

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

    const success =
      this.tenantService.approveTenant(
        tenant.id
      );

    if (success) {

      alert(
        `${tenant.name} has been approved successfully.`
      );

      this.tenants =
        this.tenantService.getTenants();
    }
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

    if (!this.rejectionReason.trim()) {

      alert(
        'Please enter a reason for rejection.'
      );

      return;
    }

    const tenantName =
      this.selectedTenant.name;

    const success =
      this.tenantService.rejectTenant(
        this.selectedTenant.id
      );

    if (success) {

      alert(
        `${tenantName} has been rejected.`
      );

      this.tenants =
        this.tenantService.getTenants();

      this.closeRejectModal();
    }
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