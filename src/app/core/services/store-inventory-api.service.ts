import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface StoreInventoryStockRow {
  id: number;
  tenantId: number;
  storeId: number;
  storeName: string;
  inventoryItemId: number;
  medicineName: string;
  sku?: string | null;
  batchId: number;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  batchStatus: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

@Injectable({ providedIn: 'root' })
export class StoreInventoryApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  listForStore(
    tenantId: number,
    storeId: number
  ): Observable<StoreInventoryStockRow[]> {
    return this.http.get<StoreInventoryStockRow[]>(
      `${this.baseUrl}/tenants/${tenantId}/stores/${storeId}/inventory`
    );
  }
}
