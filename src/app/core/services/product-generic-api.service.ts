import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProductGeneric {
  id: number;
  tenantId: number;
  name: string;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProductGenericRequest {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class ProductGenericApiService {
  private readonly baseUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) {}

  list(tenantId: number): Observable<ProductGeneric[]> {
    return this.http.get<ProductGeneric[]>(
      `${this.baseUrl}/${tenantId}/product-generics`
    );
  }

  create(tenantId: number, request: ProductGenericRequest): Observable<ProductGeneric> {
    return this.http.post<ProductGeneric>(
      `${this.baseUrl}/${tenantId}/product-generics`, request
    );
  }

  update(
    tenantId: number,
    genericId: number,
    request: ProductGenericRequest
  ): Observable<ProductGeneric> {
    return this.http.put<ProductGeneric>(
      `${this.baseUrl}/${tenantId}/product-generics/${genericId}`, request
    );
  }

  archive(tenantId: number, genericId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${tenantId}/product-generics/${genericId}`
    );
  }
}
