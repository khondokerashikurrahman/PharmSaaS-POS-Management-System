import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SalesmanRequest {
  employeeId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  territory?: string;
  commissionRate: number;
  status: 'Active' | 'Inactive';
}

export interface SalesmanResponse {
  id: number;
  tenantId: number;
  employeeId: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  territory?: string | null;
  commissionRate: number;
  status: 'Active' | 'Inactive';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SalesmanApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tenants`;

  private tenantId(): number {
    const id = Number(localStorage.getItem('tenantId'));
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Valid tenant ID was not found. Please select your pharmacy again.');
    }
    return id;
  }

  list(): Observable<SalesmanResponse[]> {
    return this.http.get<SalesmanResponse[]>(
      `${this.baseUrl}/${this.tenantId()}/salesmen`
    );
  }

  get(id: number): Observable<SalesmanResponse> {
    return this.http.get<SalesmanResponse>(
      `${this.baseUrl}/${this.tenantId()}/salesmen/${id}`
    );
  }

  create(request: SalesmanRequest): Observable<SalesmanResponse> {
    return this.http.post<SalesmanResponse>(
      `${this.baseUrl}/${this.tenantId()}/salesmen`,
      request
    );
  }

  update(id: number, request: SalesmanRequest): Observable<SalesmanResponse> {
    return this.http.put<SalesmanResponse>(
      `${this.baseUrl}/${this.tenantId()}/salesmen/${id}`,
      request
    );
  }

  deactivate(id: number): Observable<SalesmanResponse> {
    return this.http.patch<SalesmanResponse>(
      `${this.baseUrl}/${this.tenantId()}/salesmen/${id}/deactivate`,
      {}
    );
  }
}
