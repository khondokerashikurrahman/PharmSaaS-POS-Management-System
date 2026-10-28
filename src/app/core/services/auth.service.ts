import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { ApiService } from './api.service';
import {
  MembershipRole,
  User,
  UserRole
} from '../models/user.model';

export { User } from '../models/user.model';

export interface LoginResponse {
  token: string;
  tokenType: string;
  userId: number;
  fullName: string;
  email: string;
  tenantId: number | null;

  // Normalized frontend role.
  role: string;

  // Original backend membership role.
  membershipRole?: string | null;

  tenantStatus: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly tokenKey = 'pharm_access_token';
  private readonly userKey = 'pharm_user';
  private readonly loggedInKey = 'isLoggedIn';
  private readonly tenantKey = 'tenantId';
  private readonly roleKey = 'userRole';
  private readonly branchKey = 'branchIds';
  private readonly tenantStatusKey = 'tenantStatus';

  constructor(
    private readonly api: ApiService,
    private readonly router: Router
  ) {}

  login(
    email: string,
    password: string
  ): Observable<LoginResponse> {

    return this.api.post<LoginResponse>(
      '/auth/login',
      {
        email: email.trim().toLowerCase(),
        password
      }
    ).pipe(
      tap(response => {

        if (
          !response?.token ||
          response.userId == null ||
          !response.email ||
          !response.role
        ) {
          throw new Error(
            'Invalid login response received from server.'
          );
        }

        const role = response.role.toUpperCase();

        const allowedRoles: UserRole[] = [
          'SUPER_ADMIN',
          'TENANT_ADMIN',
          'MANAGER',
          'STAFF',
          'STORE_KEEPER'
        ];

        if (!allowedRoles.includes(role as UserRole)) {
          throw new Error(
            `Unsupported user role: ${role}`
          );
        }

        if (
          role !== 'SUPER_ADMIN' &&
          response.tenantId == null
        ) {
          throw new Error(
            'Tenant ID is missing from login response.'
          );
        }

        const membershipRole = this.resolveMembershipRole(
          response.membershipRole,
          role
        );

        if (
          role !== 'SUPER_ADMIN' &&
          !membershipRole
        ) {
          throw new Error(
            'Membership role is missing from login response.'
          );
        }

        const user: User = {
          id: String(response.userId),

          tenantId: response.tenantId == null
            ? null
            : String(response.tenantId),

          name: response.fullName,
          email: response.email,

          // Existing layout and navigation use this role.
          role: role as UserRole,

          // Permission rules use the exact membership role.
          membershipRole,

          branchIds: [],

          status: 'ACTIVE'
        };

        this.clearAuthData();

        localStorage.setItem(
          this.tokenKey,
          response.token
        );

        localStorage.setItem(
          this.loggedInKey,
          'true'
        );

        localStorage.setItem(
          this.userKey,
          JSON.stringify(user)
        );

        localStorage.setItem(
          this.roleKey,
          role
        );

        localStorage.setItem(
          this.branchKey,
          JSON.stringify([])
        );

        if (response.tenantId != null) {
          localStorage.setItem(
            this.tenantKey,
            String(response.tenantId)
          );
        }

        if (response.tenantStatus != null) {
          localStorage.setItem(
            this.tenantStatusKey,
            response.tenantStatus
          );
        }

        const destination = this.getDashboardRoute(role);

        void this.router.navigateByUrl(destination);
      })
    );
  }

  private resolveMembershipRole(
    rawRole: string | null | undefined,
    normalizedRole: string
  ): MembershipRole | undefined {

    if (normalizedRole === 'SUPER_ADMIN') {
      return undefined;
    }

    const allowedMembershipRoles: MembershipRole[] = [
      'TENANT_OWNER',
      'PHARMACY_ADMIN',
      'MANAGER',
      'STORE_KEEPER',
      'PHARMACIST',
      'STAFF',
      'CASHIER'
    ];

    if (rawRole) {
      const candidate = rawRole.toUpperCase() as MembershipRole;

      if (!allowedMembershipRoles.includes(candidate)) {
        throw new Error(
          `Unsupported membership role: ${rawRole}`
        );
      }

      return candidate;
    }

    // Compatibility fallback for a backend response
    // that does not yet include membershipRole.
    switch (normalizedRole) {
      case 'TENANT_ADMIN':
        return 'PHARMACY_ADMIN';

      case 'MANAGER':
        return 'MANAGER';

      case 'STORE_KEEPER':
        return 'STORE_KEEPER';

      case 'STAFF':
        return 'STAFF';

      default:
        return undefined;
    }
  }

  private getDashboardRoute(role: string): string {

    switch (role) {
      case 'SUPER_ADMIN':
        return '/admin/dashboard';

      case 'TENANT_ADMIN':
      case 'MANAGER':
      case 'STAFF':
      case 'STORE_KEEPER':
        return '/app/dashboard';

      default:
        return '/login';
    }
  }

  logout(): void {
    this.clearAuthData();
    void this.router.navigateByUrl('/login');
  }

  private clearAuthData(): void {

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.loggedInKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.tenantKey);
    localStorage.removeItem(this.roleKey);
    localStorage.removeItem(this.branchKey);
    localStorage.removeItem(this.tenantStatusKey);

    localStorage.removeItem('current_tenant_id');
    localStorage.removeItem('admin_selected_tenant');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): User | null {

    const data = localStorage.getItem(this.userKey);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as User;
    } catch {
      this.clearAuthData();
      return null;
    }
  }

  getRole(): UserRole | null {
    return this.getCurrentUser()?.role ?? null;
  }

  getMembershipRole(): MembershipRole | null {
    return this.getCurrentUser()?.membershipRole ?? null;
  }

  getTenantId(): string | null {
    return this.getCurrentUser()?.tenantId || null;
  }

  getBranchIds(): string[] {
    return this.getCurrentUser()?.branchIds ?? [];
  }

  getTenantStatus(): string | null {
    return localStorage.getItem(this.tenantStatusKey);
  }

  hasRole(role: UserRole): boolean {
    return this.getRole() === role;
  }

  hasMembershipRole(role: MembershipRole): boolean {
    return this.getMembershipRole() === role;
  }

  isSuperAdmin(): boolean {
    return this.hasRole('SUPER_ADMIN');
  }

  isTenantAdmin(): boolean {
    return this.hasRole('TENANT_ADMIN');
  }

  isTenantOwner(): boolean {
    return this.hasMembershipRole('TENANT_OWNER');
  }

  isPharmacyAdmin(): boolean {
    return this.hasMembershipRole('PHARMACY_ADMIN');
  }

  isManager(): boolean {
    return this.hasMembershipRole('MANAGER');
  }

  isStoreKeeper(): boolean {
    return this.hasMembershipRole('STORE_KEEPER');
  }

  isPharmacist(): boolean {
    return this.hasMembershipRole('PHARMACIST');
  }

  isStaff(): boolean {
    return this.hasMembershipRole('STAFF');
  }

  isCashier(): boolean {
    return this.hasMembershipRole('CASHIER');
  }

  isTenantUser(): boolean {
    return this.getRole() !== null &&
      this.getRole() !== 'SUPER_ADMIN';
  }
}
