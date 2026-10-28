import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface BranchTransferItemDto {
  id: number;
  inventoryItemId: number;
  medicineName?: string;
  sku?: string;
  batchId: number;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  receivedQuantity?: number | null;
  damagedQuantity?: number;
}

export interface BranchTransferDto {
  id: number;
  tenantId?: number;
  transferNumber?: string;
  sourceStoreId: number;
  sourceStoreName?: string;
  destinationStoreId: number;
  destinationStoreName?: string;
  status: string;
  reason?: string;
  actionNote?: string;
  requestedBy?: string;
  requestedByName?: string;
  requestedByUserId?: number;
  requestedAt?: string;
  createdAt?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  receivedByUserId?: number;
  items?: BranchTransferItemDto[];
}

export interface BranchTransferCreateRequest {
  sourceStoreId: number;
  destinationStoreId: number;
  reason: string;
  items: { batchId: number; quantity: number }[];
}

export interface BranchTransferActionRequest {
  note?: string;
  items?: { transferItemId: number; receivedQuantity: number }[];
}

@Injectable({ providedIn: 'root' })
export class BranchTransferApiService {
  constructor(private http: HttpClient) {}

  private resolveTenantId(suppliedId?: number): number | null {
    if (suppliedId && suppliedId > 0) return suppliedId;

    const savedId = Number(
      localStorage.getItem('tenantId') ||
      localStorage.getItem('tenant_id') ||
      0
    );

    if (savedId > 0) return savedId;

    try {
      const user = JSON.parse(localStorage.getItem('pharm_user') || '{}');
      const userTenantId = Number(user.tenantId || user.tenant?.id || 0);
      return userTenantId > 0 ? userTenantId : null;
    } catch {
      return null;
    }
  }

  private endpoint(tenantId?: number): string | null {
    const id = this.resolveTenantId(tenantId);
    if (!id) return null;
    return `${environment.apiUrl}/tenants/${id}/branch-transfers`;
  }

  private missingTenantError<T>(): Observable<T> {
    return throwError(() =>
      new Error('Tenant ID পাওয়া যায়নি। আগে tenant account দিয়ে login/select করো।')
    );
  }

  list(tenantId?: number): Observable<BranchTransferDto[]> {
    const url = this.endpoint(tenantId);
    return url
      ? this.http.get<BranchTransferDto[]>(url)
      : this.missingTenantError<BranchTransferDto[]>();
  }

  getById(id: number | string, tenantId?: number): Observable<BranchTransferDto> {
    const url = this.endpoint(tenantId);
    return url
      ? this.http.get<BranchTransferDto>(`${url}/${id}`)
      : this.missingTenantError<BranchTransferDto>();
  }

  create(
    request: BranchTransferCreateRequest,
    tenantId?: number
  ): Observable<BranchTransferDto> {
    const url = this.endpoint(tenantId);
    return url
      ? this.http.post<BranchTransferDto>(url, request)
      : this.missingTenantError<BranchTransferDto>();
  }

  approve(
    id: number | string,
    note = '',
    tenantId?: number
  ): Observable<BranchTransferDto> {
    const url = this.endpoint(tenantId);
    return url
      ? this.http.post<BranchTransferDto>(
          `${url}/${id}/approve`,
          { note }
        )
      : this.missingTenantError<BranchTransferDto>();
  }

  reject(
    id: number | string,
    note: string,
    tenantId?: number
  ): Observable<BranchTransferDto> {
    const url = this.endpoint(tenantId);
    return url
      ? this.http.post<BranchTransferDto>(
          `${url}/${id}/reject`,
          { note }
        )
      : this.missingTenantError<BranchTransferDto>();
  }

  dispatch(
    id: number | string,
    note = '',
    tenantId?: number
  ): Observable<BranchTransferDto> {
    const url = this.endpoint(tenantId);
    return url
      ? this.http.post<BranchTransferDto>(
          `${url}/${id}/dispatch`,
          { note }
        )
      : this.missingTenantError<BranchTransferDto>();
  }

  receive(
    id: number | string,
    request: BranchTransferActionRequest,
    tenantId?: number
  ): Observable<BranchTransferDto> {
    const url = this.endpoint(tenantId);
    return url
      ? this.http.post<BranchTransferDto>(
          `${url}/${id}/receive`,
          request
        )
      : this.missingTenantError<BranchTransferDto>();
  }
}
