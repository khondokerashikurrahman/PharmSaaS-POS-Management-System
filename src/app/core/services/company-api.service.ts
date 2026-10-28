import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ManufacturerCompany {
  id: number;
  tenantId: number;
  companyCode: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  status: 'Active' | 'Inactive';
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CompanyRequest {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: 'Active' | 'Inactive';
}

@Injectable({ providedIn: 'root' })
export class CompanyApiService {
  private readonly baseUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) {}

  list(tenantId: number): Observable<ManufacturerCompany[]> {
    return this.http.get<ManufacturerCompany[]>(
      `${this.baseUrl}/${tenantId}/companies`
    );
  }

  get(tenantId: number, companyId: number): Observable<ManufacturerCompany> {
    return this.http.get<ManufacturerCompany>(
      `${this.baseUrl}/${tenantId}/companies/${companyId}`
    );
  }

  create(tenantId: number, request: CompanyRequest): Observable<ManufacturerCompany> {
    return this.http.post<ManufacturerCompany>(
      `${this.baseUrl}/${tenantId}/companies`, request
    );
  }

  update(
    tenantId: number,
    companyId: number,
    request: CompanyRequest
  ): Observable<ManufacturerCompany> {
    return this.http.put<ManufacturerCompany>(
      `${this.baseUrl}/${tenantId}/companies/${companyId}`, request
    );
  }

  deactivate(tenantId: number, companyId: number): Observable<ManufacturerCompany> {
    return this.http.patch<ManufacturerCompany>(
      `${this.baseUrl}/${tenantId}/companies/${companyId}/deactivate`, {}
    );
  }
}
