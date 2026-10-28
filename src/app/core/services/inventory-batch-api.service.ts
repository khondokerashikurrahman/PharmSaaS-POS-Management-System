import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TenantInventoryItem } from './tenant-inventory-api.service';

export interface InventoryBatchCreateRequest {
  inventoryItemId: number;
  batchNumber: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  sellingPrice: number;
}

export interface InventoryBatch {
  id: number;
  tenantId: number;
  inventoryItemId: number;
  medicineName: string;
  batchNumber: string;
  manufactureDate: string | null;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  status: string;
  createdAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class InventoryBatchApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  create(tenantId: number, request: InventoryBatchCreateRequest): Observable<InventoryBatch> {
    return this.http.post<InventoryBatch>(
      `${this.baseUrl}/tenants/${tenantId}/inventory/batches`,
      request
    );
  }

  list(tenantId: number, itemId?: number): Observable<InventoryBatch[]> {
    const url = `${this.baseUrl}/tenants/${tenantId}/inventory/batches`;
    return this.http.get<InventoryBatch[]>(
      itemId ? `${url}?itemId=${itemId}` : url
    );
  }
}
