import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type RefundPaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'MOBILE_BANKING'
  | 'BANK_TRANSFER';

export interface RefundResponse {
  id: number;
  saleReturnId: number;
  refundNumber: string;
  requestKey: string;
  amount: number;
  paymentMethod: string;
  transactionReference: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | string;
  notes: string | null;
  createdAt: string;
  processedAt: string | null;
  createdById: number | null;
  processedById: number | null;
}

export interface RefundCreateRequest {
  requestKey: string;
  amount: number;
  paymentMethod: RefundPaymentMethod;
  transactionReference?: string;
  notes?: string;
}

export interface RefundProcessRequest {
  transactionReference?: string;
  notes?: string;
}

@Injectable({ providedIn: 'root' })
export class RefundApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tenants`;

  listRefunds(tenantId: number): Observable<RefundResponse[]> {
    return this.http.get<RefundResponse[]>(
      `${this.baseUrl}/${tenantId}/refunds`
    );
  }

  createRefund(
    tenantId: number,
    returnId: number,
    request: RefundCreateRequest
  ): Observable<RefundResponse> {
    return this.http.post<RefundResponse>(
      `${this.baseUrl}/${tenantId}/refunds/returns/${returnId}`,
      request
    );
  }

  completeRefund(
    tenantId: number,
    refundId: number,
    request: RefundProcessRequest
  ): Observable<RefundResponse> {
    return this.http.post<RefundResponse>(
      `${this.baseUrl}/${tenantId}/refunds/${refundId}/complete`,
      request
    );
  }

  failRefund(
    tenantId: number,
    refundId: number,
    request: RefundProcessRequest
  ): Observable<RefundResponse> {
    return this.http.post<RefundResponse>(
      `${this.baseUrl}/${tenantId}/refunds/${refundId}/fail`,
      request
    );
  }
}
