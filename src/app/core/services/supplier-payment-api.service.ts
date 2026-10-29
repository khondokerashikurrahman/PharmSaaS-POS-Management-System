import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SupplierPaymentRequest {
  supplierId: number;
  paymentDate: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Card' | 'Mobile Banking';
  referenceNumber?: string;
  notes?: string;
}

export interface SupplierPaymentResponse {
  id: number;
  tenantId: number;
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Card' | 'Mobile Banking';
  referenceNumber?: string | null;
  notes?: string | null;
  status: 'PAID' | 'CANCELLED' | string;
  createdBy: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class SupplierPaymentApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  list(tenantId: number, supplierId?: number): Observable<SupplierPaymentResponse[]> {
    const url = `${this.baseUrl}/tenants/${tenantId}/supplier-payments`;
    return this.http.get<SupplierPaymentResponse[]>(
      supplierId ? `${url}?supplierId=${supplierId}` : url
    );
  }

  getById(tenantId: number, paymentId: number): Observable<SupplierPaymentResponse> {
    return this.http.get<SupplierPaymentResponse>(
      `${this.baseUrl}/tenants/${tenantId}/supplier-payments/${paymentId}`
    );
  }

  create(tenantId: number, request: SupplierPaymentRequest): Observable<SupplierPaymentResponse> {
    return this.http.post<SupplierPaymentResponse>(
      `${this.baseUrl}/tenants/${tenantId}/supplier-payments`, request
    );
  }

  cancel(tenantId: number, paymentId: number): Observable<SupplierPaymentResponse> {
    return this.http.patch<SupplierPaymentResponse>(
      `${this.baseUrl}/tenants/${tenantId}/supplier-payments/${paymentId}/cancel`, {}
    );
  }
}
