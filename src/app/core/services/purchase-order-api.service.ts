import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PurchaseOrderItemRequest {
  inventoryItemId?: number;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
}

export interface PurchaseOrderRequest {
  supplierName: string;
  branchId?: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  discount?: number;
  tax?: number;
  notes?: string;
  items: PurchaseOrderItemRequest[];
  supplierId?: number;
}

export interface PurchaseOrderItemResponse {
  id: number;
  inventoryItemId?: number;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface PurchaseOrderResponse {
  id: number;
  tenantId: number;
  orderNumber: string;
  supplierName: string;
  branchId?: number;
  orderDate: string;
  expectedDeliveryDate?: string;
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  status: string;
  notes?: string;
  createdBy: number;
  approvedBy?: number;
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  items: PurchaseOrderItemResponse[];
  supplierId?: number | null;
}

@Injectable({ providedIn: 'root' })
export class PurchaseOrderApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  create(tenantId: number, request: PurchaseOrderRequest):
    Observable<PurchaseOrderResponse> {
    return this.http.post<PurchaseOrderResponse>(
      `${this.baseUrl}/tenants/${tenantId}/purchase-orders`,
      request
    );
  }

  list(tenantId: number): Observable<PurchaseOrderResponse[]> {
    return this.http.get<PurchaseOrderResponse[]>(
      `${this.baseUrl}/tenants/${tenantId}/purchase-orders`
    );
  }

  getById(tenantId: number, orderId: number):
    Observable<PurchaseOrderResponse> {
    return this.http.get<PurchaseOrderResponse>(
      `${this.baseUrl}/tenants/${tenantId}/purchase-orders/${orderId}`
    );
  }

  update(tenantId: number, orderId: number, request: PurchaseOrderRequest):
    Observable<PurchaseOrderResponse> {
    return this.http.put<PurchaseOrderResponse>(
      `${this.baseUrl}/tenants/${tenantId}/purchase-orders/${orderId}`,
      request
    );
  }

  submit(tenantId: number, orderId: number):
    Observable<PurchaseOrderResponse> {
    return this.http.patch<PurchaseOrderResponse>(
      `${this.baseUrl}/tenants/${tenantId}/purchase-orders/${orderId}/submit`,
      {}
    );
  }

  cancel(tenantId: number, orderId: number):
    Observable<PurchaseOrderResponse> {
    return this.http.patch<PurchaseOrderResponse>(
      `${this.baseUrl}/tenants/${tenantId}/purchase-orders/${orderId}/cancel`,
      {}
    );
  }

  delete(tenantId: number, orderId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/tenants/${tenantId}/purchase-orders/${orderId}`
    );
  }
}
