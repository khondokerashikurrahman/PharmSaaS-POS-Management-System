import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SearchBoxComponent } from '../search-box/search-box.component';

import {
  AuthService,
  User
} from '../../../core/services/auth.service';

import {
  TenantService,
  Tenant
} from '../../../core/services/tenant.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [
    SearchBoxComponent,
    CommonModule
  ],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss'
})
export class TopbarComponent implements OnInit {

  isDropdownOpen = false;

  currentUser: User | null = null;
  currentTenant: Tenant | undefined;

  constructor(
    private authService: AuthService,
    private tenantService: TenantService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();

    this.loadCurrentTenant();
  }

  private loadCurrentTenant(): void {
    const tenantId = this.currentUser?.tenantId;

    if (!tenantId) {
      this.currentTenant = undefined;
      return;
    }

    this.currentTenant =
      this.tenantService.getTenantById(tenantId);
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  getUserInitial(): string {
    return (
      this.currentUser?.name?.charAt(0).toUpperCase() || 'U'
    );
  }

  getRoleLabel(): string {
    switch (this.currentUser?.role) {

      case 'SUPER_ADMIN':
        return 'Super Administrator';

      case 'TENANT_ADMIN':
        return 'Pharmacy Administrator';

      case 'MANAGER':
        return 'Manager';

      case 'STAFF':
        return 'Staff';

      case 'STORE_KEEPER':
        return 'Store Keeper';

      default:
        return 'User';
    }
  }

  isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  isTenantUser(): boolean {
    return this.authService.isTenantUser();
  }

  logout(): void {
    this.closeDropdown();

    this.authService.logout();
  }
}