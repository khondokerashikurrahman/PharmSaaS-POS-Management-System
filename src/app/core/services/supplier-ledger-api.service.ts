import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SupplierLedgerTransactionResponse {
  id: string;
  date: string | null;
  type: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  status: string;
}

export interface SupplierLedgerResponse {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  openingBalance: number;
  totalPurchases: number;
  totalPayments: number;
  outstandingBalance: number;
  transactions: SupplierLedgerTransactionResponse[];
}

@Injectable({ providedIn: 'root' })
export class SupplierLedgerApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  get(
    tenantId: number,
    supplierId: number
  ): Observable<SupplierLedgerResponse> {
    return this.http.get<SupplierLedgerResponse>(
      `${this.baseUrl}/tenants/${tenantId}/suppliers/${supplierId}/ledger`
    );
  }
}
