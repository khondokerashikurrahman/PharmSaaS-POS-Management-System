import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface PurchaseReturnItemRequest {
  grnItemId: number;
  quantity: number;
  reason?: string;
}

export interface PurchaseReturnCreateRequest {
  grnId: number;
  storeId: number;
  returnDate: string;
  reason: string;
  notes: string;
  items: PurchaseReturnItemRequest[];
}

export interface PurchaseReturnResponse {
  id: number;
  returnNumber: string;
  grnId: number;
  grnNumber: string;
  supplierId: number;
  supplierName: string;
  storeId: number;
  storeName: string;
  returnDate: string;
  items: Array<{
    id: number;
    grnItemId: number;
    medicineId: number;
    medicineName: string;
    batchId: number;
    batchNumber: string;
    receivedQuantity: number;
    quantity: number;
    unitPrice: number;
    total: number;
    reason?: string;
  }>;
  subtotal: number;
  totalAmount: number;
  status: string;
  reason?: string;
  notes?: string;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class PurchaseReturnApiService {
  constructor(private api: ApiService) {}

  private path(tenantId: number): string {
    return `/tenants/${tenantId}/purchase-returns`;
  }

  list(tenantId: number): Observable<PurchaseReturnResponse[]> {
    return this.api.get<PurchaseReturnResponse[]>(this.path(tenantId));
  }

  getById(tenantId: number, id: number): Observable<PurchaseReturnResponse> {
    return this.api.get<PurchaseReturnResponse>(`${this.path(tenantId)}/${id}`);
  }

  create(tenantId: number, request: PurchaseReturnCreateRequest): Observable<PurchaseReturnResponse> {
    return this.api.post<PurchaseReturnResponse>(this.path(tenantId), request);
  }

  submit(tenantId: number, id: number): Observable<PurchaseReturnResponse> {
    return this.api.patch<PurchaseReturnResponse>(`${this.path(tenantId)}/${id}/submit`);
  }

  complete(tenantId: number, id: number): Observable<PurchaseReturnResponse> {
    return this.api.patch<PurchaseReturnResponse>(`${this.path(tenantId)}/${id}/complete`);
  }

  cancel(tenantId: number, id: number): Observable<PurchaseReturnResponse> {
    return this.api.patch<PurchaseReturnResponse>(`${this.path(tenantId)}/${id}/cancel`);
  }
}
