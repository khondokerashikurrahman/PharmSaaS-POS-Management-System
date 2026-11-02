import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CustomerRequest {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance?: number;
  status?: 'Active' | 'Inactive' | 'Blocked';
}

export interface CustomerResponse {
  id: number;
  tenantId: number;
  customerCode: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  openingBalance: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerPurchaseResponse {
  saleId: number;
  invoiceNumber: string;
  date: string;
  itemCount: number;
  amount: number;
  paymentMethod: string;
  status: string;
}

export interface CustomerLedgerTransaction {
  id: number | null;
  date: string;
  reference: string;
  description: string;
  type: 'Purchase' | 'Payment' | 'Adjustment' | 'Return';
  debit: number;
  credit: number;
  balance: number;
}

export interface CustomerLedgerResponse {
  customerId: number;
  customerName: string;
  openingBalance: number;
  totalPurchases: number;
  totalPaid: number;
  totalRefunded: number;
  currentBalance: number;
  transactions: CustomerLedgerTransaction[];
}

@Injectable({ providedIn: 'root' })
export class CustomerApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  list(tenantId: number): Observable<CustomerResponse[]> {
    return this.http.get<CustomerResponse[]>(
      `${this.baseUrl}/tenants/${tenantId}/customers`
    );
  }

  getById(tenantId: number, customerId: number): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(
      `${this.baseUrl}/tenants/${tenantId}/customers/${customerId}`
    );
  }

  create(tenantId: number, request: CustomerRequest): Observable<CustomerResponse> {
    return this.http.post<CustomerResponse>(
      `${this.baseUrl}/tenants/${tenantId}/customers`, request
    );
  }

  update(tenantId: number, customerId: number, request: CustomerRequest): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(
      `${this.baseUrl}/tenants/${tenantId}/customers/${customerId}`, request
    );
  }

  deactivate(tenantId: number, customerId: number): Observable<CustomerResponse> {
    return this.http.patch<CustomerResponse>(
      `${this.baseUrl}/tenants/${tenantId}/customers/${customerId}/deactivate`, {}
    );
  }

  purchases(tenantId: number, customerId: number): Observable<CustomerPurchaseResponse[]> {
    return this.http.get<CustomerPurchaseResponse[]>(
      `${this.baseUrl}/tenants/${tenantId}/customers/${customerId}/purchases`
    );
  }

  ledger(tenantId: number, customerId: number): Observable<CustomerLedgerResponse> {
    return this.http.get<CustomerLedgerResponse>(
      `${this.baseUrl}/tenants/${tenantId}/customers/${customerId}/ledger`
    );
  }
}
