import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

import {
  AuthService,
  User
} from '../../../core/services/auth.service';

import {
  TenantService,
  Tenant
} from '../../../core/services/tenant.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {

  currentUser: User | null = null;

  currentTenant: Tenant | undefined;

  constructor(
    private authService: AuthService,
    private tenantService: TenantService
  ) {}

  ngOnInit(): void {

    this.currentUser =
      this.authService.getCurrentUser();

    this.loadCurrentTenant();
  }

  // =====================================================
  // CURRENT TENANT
  // =====================================================

  private loadCurrentTenant(): void {

    if (
      this.currentUser?.tenantId
    ) {

      this.currentTenant =
        this.tenantService.getTenantById(
          this.currentUser.tenantId
        );

      return;
    }

    this.currentTenant = undefined;
  }

  // =====================================================
  // USER INITIAL
  // =====================================================

  getUserInitial(): string {

    return (
      this.currentUser?.name
        ?.charAt(0)
        .toUpperCase()
      || 'U'
    );
  }

  // =====================================================
  // ROLE LABEL
  // =====================================================

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

  // =====================================================
  // TENANT CHECK
  // =====================================================

  isTenantUser(): boolean {

    return this.authService.isTenantUser();
  }

  // =====================================================
  // SUPER ADMIN CHECK
  // =====================================================

  isSuperAdmin(): boolean {

    return this.authService.isSuperAdmin();
  }

  // =====================================================
  // LOGOUT
  // =====================================================

  logout(): void {

    this.authService.logout();
  }
}