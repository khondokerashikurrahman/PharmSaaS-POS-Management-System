import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type StoreStatus = 'Active' | 'Inactive';

export interface StoreResponse {
  id: number;
  tenantId: number;
  storeCode: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  status: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface StoreRequest {
  storeCode: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  status: StoreStatus;
}

@Injectable({ providedIn: 'root' })
export class StoreApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  private storesUrl(tenantId: number): string {
    return `${this.baseUrl}/tenants/${tenantId}/stores`;
  }

  getAll(tenantId: number): Observable<StoreResponse[]> {
    return this.http.get<StoreResponse[]>(this.storesUrl(tenantId));
  }

  getById(tenantId: number, storeId: number): Observable<StoreResponse> {
    return this.http.get<StoreResponse>(
      `${this.storesUrl(tenantId)}/${storeId}`
    );
  }

  create(tenantId: number, request: StoreRequest): Observable<StoreResponse> {
    return this.http.post<StoreResponse>(this.storesUrl(tenantId), request);
  }

  update(
    tenantId: number,
    storeId: number,
    request: StoreRequest
  ): Observable<StoreResponse> {
    return this.http.put<StoreResponse>(
      `${this.storesUrl(tenantId)}/${storeId}`,
      request
    );
  }

  delete(tenantId: number, storeId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.storesUrl(tenantId)}/${storeId}`
    );
  }
}
