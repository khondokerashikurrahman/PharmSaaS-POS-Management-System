
import { Injectable } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export type StaffRole =
  | 'TENANT_OWNER'
  | 'PHARMACY_ADMIN'
  | 'MANAGER'
  | 'STORE_KEEPER'
  | 'PHARMACIST'
  | 'STAFF'
  | 'CASHIER';

interface MembershipApiResponse {
  membershipId: number;
  tenantId: number;
  userId: number;
  fullName: string;
  email: string;
  role: StaffRole;
  active: boolean;
}

interface PlatformUserApiResponse {
  id: number;
  fullName: string;
  email: string;
  enabled: boolean;
  systemRole: string;
}

export interface ManagedUser {
  id: number | string;
  membershipId?: number;
  tenantId?: number;
  userId?: number;
  fullName?: string;
  name?: string;
  email: string;
  role?: string;
  membershipRole?: string;
  enabled?: boolean;
  active?: boolean;
  status?: string;
  systemRole?: string;
}

export interface CreateManagedUser {
  fullName: string;
  email: string;
  password: string;
  role: StaffRole;
}

@Injectable({ providedIn: 'root' })
export class UserServiceService {
  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  private get tenantId(): string {
    const id = this.auth.getTenantId();

    if (!id) {
      throw new Error('Your account has no tenant assigned.');
    }

    return String(id);
  }

  private get membershipEndpoint(): string {
    return `/tenants/${encodeURIComponent(this.tenantId)}/memberships`;
  }

  getUsers(): Observable<ManagedUser[]> {
    if (this.auth.isSuperAdmin()) {
      return this.api
        .get<PlatformUserApiResponse[]>('/auth/users')
        .pipe(
          map(users =>
            users.map(user => ({
              id: user.id,
              userId: user.id,
              fullName: user.fullName,
              name: user.fullName,
              email: user.email,
              enabled: user.enabled,
              active: user.enabled,
              status: user.enabled ? 'ACTIVE' : 'INACTIVE',
              systemRole: user.systemRole,
              role: user.systemRole
            }))
          )
        );
    }

    return this.api
      .get<MembershipApiResponse[]>(this.membershipEndpoint)
      .pipe(
        map(members =>
          members.map(member => ({
            id: member.userId,
            userId: member.userId,
            membershipId: member.membershipId,
            tenantId: member.tenantId,
            fullName: member.fullName,
            name: member.fullName,
            email: member.email,
            role: member.role,
            membershipRole: member.role,
            enabled: member.active,
            active: member.active,
            status: member.active ? 'ACTIVE' : 'INACTIVE'
          }))
        )
      );
  }

  createUser(payload: CreateManagedUser): Observable<unknown> {
    const body = {
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      role: payload.role
    };

    if (this.auth.isSuperAdmin()) {
      return this.api.post('/auth/platform-users', {
        fullName: body.fullName,
        email: body.email,
        password: body.password
      });
    }

    return this.api.post(
      `${this.membershipEndpoint}/users`,
      body
    );
  }

  updateRole(
    userId: number | string,
    role: StaffRole
  ): Observable<MembershipApiResponse> {
    if (this.auth.isSuperAdmin()) {
      return throwError(
        () => new Error('Platform users do not use tenant membership roles.')
      );
    }

    return this.api.put<MembershipApiResponse>(
      `${this.membershipEndpoint}/${encodeURIComponent(String(userId))}/role`,
      { role }
    );
  }

  updateStatus(
    userId: number | string,
    active: boolean
  ): Observable<MembershipApiResponse> {
    if (this.auth.isSuperAdmin()) {
      return throwError(
        () => new Error('Use platform-user status management for Super Admin.')
      );
    }

    return this.api.put<MembershipApiResponse>(
      `${this.membershipEndpoint}/${encodeURIComponent(String(userId))}/status`,
      { active }
    );
  }

  deleteMember(userId: number | string): Observable<void> {
  if (this.auth.isSuperAdmin()) {
    return throwError(
      () => new Error('Platform users cannot be deleted through tenant membership.')
    );
  }

  return this.api.delete<void>(
    `${this.membershipEndpoint}/${encodeURIComponent(String(userId))}`
  );
}
}
