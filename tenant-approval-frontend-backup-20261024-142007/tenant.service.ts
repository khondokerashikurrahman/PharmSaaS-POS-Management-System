
import { Injectable } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Tenant } from '../models/tenant.model';

export { Tenant } from '../models/tenant.model';

interface BackendTenant {
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
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private readonly currentTenantKey = 'current_tenant_id';
  private tenants: Tenant[] = [];

  constructor(private readonly api: ApiService) {}

  /**
   * Fetch the real tenant list from the backend.
   */
  loadTenants(): Observable<Tenant[]> {
    return this.api.get<BackendTenant[]>('/tenants').pipe(
      map(rows => rows.map(row => this.mapTenant(row))),
      tap(tenants => {
        this.tenants = tenants;
      })
    );
  }

  /**
   * Return the latest cached list.
   * Use loadTenants() when fresh backend data is needed.
   */
  getTenants(): Tenant[] {
    return [...this.tenants];
  }

  getTenantById(id: string | number): Tenant | undefined {
    return this.tenants.find(
      tenant => String(tenant.id) === String(id)
    );
  }


createTenant(body: {
  tenantCode: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  status: string;
}): Observable<Tenant> {
  return this.api.post<BackendTenant>('/tenants', body).pipe(
    map(response => this.mapTenant(response)),
    tap(created => {
      this.tenants.unshift(created);
    })
  );
}


  /**
   * Update status through the backend PUT endpoint.
   */
  updateTenantStatus(
    tenant: Tenant,
    status: string
  ): Observable<Tenant> {
    const backendId = this.requireNumericId(tenant.id);

    const body = {
      tenantCode: tenant.tenantCode,
      name: tenant.name,
      ownerName: tenant.owner,
      email: tenant.email,
      phone: tenant.phone,
      address: tenant.address,
      status
    };

    return this.api.put<BackendTenant>(
      `/tenants/${backendId}`,
      body
    ).pipe(
      map(response => this.mapTenant(response)),
      tap(updated => {
        this.replaceCachedTenant(updated);
      })
    );
  }

  /**
   * Permanently delete a tenant through the backend.
   */
  deleteTenantFromBackend(
    id: string | number
  ): Observable<void> {
    const backendId = this.requireNumericId(id);

    return this.api.delete<void>(
      `/tenants/${backendId}`
    ).pipe(
      tap(() => {
        this.tenants = this.tenants.filter(
          tenant => String(tenant.id) !== String(id)
        );
      })
    );
  }

  setCurrentTenant(tenantId: string | number): boolean {
    const id = String(tenantId);

    if (!this.getTenantById(id)) {
      return false;
    }

    localStorage.setItem(this.currentTenantKey, id);
    return true;
  }

  setBackendTenantId(tenantId: string | number): boolean {
    const id = String(tenantId).trim();

    if (!id || !/^\d+$/.test(id)) {
      return false;
    }

    localStorage.setItem(this.currentTenantKey, id);
    return true;
  }

  getCurrentTenantId(): string | null {
    return localStorage.getItem(this.currentTenantKey);
  }

  getCurrentTenant(): Tenant | undefined {
    const id = this.getCurrentTenantId();
    return id ? this.getTenantById(id) : undefined;
  }

  clearCurrentTenant(): void {
    localStorage.removeItem(this.currentTenantKey);
  }

  isCurrentTenantActive(): boolean {
    return this.getCurrentTenant()?.status === 'Active';
  }

  /**
   * Legacy synchronous methods retained for compatibility.
   * These change only the local cache, not the backend.
   * Use updateTenantStatus() for real backend updates.
   */
  approveTenant(id: string): boolean {
    return this.changeCachedStatus(id, 'Active');
  }

  rejectTenant(id: string): boolean {
    return this.changeCachedStatus(id, 'Rejected');
  }

  suspendTenant(id: string): boolean {
    return this.changeCachedStatus(id, 'Suspended');
  }

  activateTenant(id: string): boolean {
    return this.changeCachedStatus(id, 'Active');
  }

  addTenant(tenant: Tenant): void {
    this.tenants.unshift(tenant);
  }

  deleteTenant(id: string): boolean {
    const before = this.tenants.length;

    this.tenants = this.tenants.filter(
      tenant => String(tenant.id) !== String(id)
    );

    return this.tenants.length !== before;
  }

  private mapTenant(row: BackendTenant): Tenant {
    const createdAt = row.createdAt ?? '';

    return {
      id: String(row.id),
      tenantCode: row.tenantCode,
      name: row.name,
      owner: row.ownerName ?? '',
      email: row.email ?? '',
      phone: row.phone ?? '',
      address: row.address ?? '',
      plan: 'Basic',
      status: this.normalizeStatus(row.status),
      registrationDate: createdAt
        ? new Date(createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : '—',
      subscriptionStart: '',
      subscriptionEnd: '',
      branches: 0,
      employees: 0,
      monthlyBilling: 0,
      createdAt: row.createdAt ?? undefined,
      updatedAt: row.updatedAt ?? undefined
    };
  }

  private normalizeStatus(status: string): Tenant['status'] {
    const normalized = (status ?? '').toLowerCase();

    switch (normalized) {
      case 'active':
        return 'Active';
      case 'approved':
        return 'Approved';
      case 'suspended':
        return 'Suspended';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Pending';
    }
  }

  private replaceCachedTenant(updated: Tenant): void {
    const index = this.tenants.findIndex(
      tenant => String(tenant.id) === String(updated.id)
    );

    if (index >= 0) {
      this.tenants[index] = updated;
    }
  }

  private changeCachedStatus(
    id: string,
    status: Tenant['status']
  ): boolean {
    const tenant = this.getTenantById(id);

    if (!tenant) {
      return false;
    }

    tenant.status = status;
    return true;
  }

  private requireNumericId(id: string | number): number {
    const value = String(id);

    if (!/^\d+$/.test(value)) {
      throw new Error(
        `Invalid backend tenant ID: ${value}. Expected a numeric ID.`
      );
    }

    return Number(value);
  }
}
