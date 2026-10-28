import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProductCategory {
  id: number;
  tenantId: number;
  productType: string;
  name: string;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ProductCategoryRequest {
  productType: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class ProductCategoryApiService {
  private readonly baseUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) {}

  list(tenantId: number, productType?: string): Observable<ProductCategory[]> {
    const url = `${this.baseUrl}/${tenantId}/product-categories`;
    return this.http.get<ProductCategory[]>(url, {
      params: productType ? { productType } : {}
    });
  }

  create(tenantId: number, request: ProductCategoryRequest): Observable<ProductCategory> {
    return this.http.post<ProductCategory>(
      `${this.baseUrl}/${tenantId}/product-categories`, request
    );
  }

  update(
    tenantId: number,
    categoryId: number,
    request: ProductCategoryRequest
  ): Observable<ProductCategory> {
    return this.http.put<ProductCategory>(
      `${this.baseUrl}/${tenantId}/product-categories/${categoryId}`,
      request
    );
  }

  archive(tenantId: number, categoryId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${tenantId}/product-categories/${categoryId}`
    );
  }
}
