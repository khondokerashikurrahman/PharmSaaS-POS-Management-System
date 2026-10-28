import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StockAdjustmentRequest {
  batchId: number;
  quantityChange: number;
  reason: string;
}

export interface StockAdjustmentResponse {
  movementId: number;
  adjustmentNumber: string;
  tenantId: number;
  inventoryItemId: number;
  medicineName: string;
  batchId: number;
  batchNumber: string;
  quantityChange: number;
  batchQuantityAfter: number;
  inventoryQuantityAfter: number;
  reason: string;
  actorUserId: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class StockAdjustmentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  adjust(
    tenantId: number,
    request: StockAdjustmentRequest
  ): Observable<StockAdjustmentResponse> {
    return this.http.post<StockAdjustmentResponse>(
      `${this.baseUrl}/tenants/${tenantId}/inventory/adjustments`,
      request
    );
  }
}
