import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StockRequestRecord {
  id: number;
  tenantId: number;
  inventoryItemId: number;
  medicineName: string;
  sku: string;
  requesterUserId: number;
  approverUserId: number | null;
  movementType: string;
  quantity: number;
  reason: string;
  status: string;
  decisionNote: string | null;
  createdAt: string;
  decidedAt: string | null;
  batchId?: number | null;
  batchNumber?: string | null;
}

export interface StockRequestCreate {
  inventoryItemId: number;
  batchId: number;
  movementType: 'STOCK_IN' | 'STOCK_OUT';
  quantity: number;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class StockRequestApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list(tenantId: number): Observable<StockRequestRecord[]> {
    return this.http.get<StockRequestRecord[]>(
      `${this.baseUrl}/tenants/${tenantId}/inventory/stock-requests`
    );
  }

  create(
    tenantId: number,
    request: StockRequestCreate
  ): Observable<StockRequestRecord> {
    return this.http.post<StockRequestRecord>(
      `${this.baseUrl}/tenants/${tenantId}/inventory/stock-requests`,
      request
    );
  }

  approve(
    tenantId: number,
    requestId: number,
    decisionNote = ''
  ): Observable<StockRequestRecord> {
    return this.http.post<StockRequestRecord>(
      `${this.baseUrl}/tenants/${tenantId}/inventory/stock-requests/${requestId}/approve`,
      { decisionNote }
    );
  }

  reject(
    tenantId: number,
    requestId: number,
    decisionNote = ''
  ): Observable<StockRequestRecord> {
    return this.http.post<StockRequestRecord>(
      `${this.baseUrl}/tenants/${tenantId}/inventory/stock-requests/${requestId}/reject`,
      { decisionNote }
    );
  }
}
