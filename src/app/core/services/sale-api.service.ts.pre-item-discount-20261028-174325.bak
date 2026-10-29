import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SaleCreateItem {
  productId: number;
  batchId: number;
  quantity: number;
}

export interface SaleCreateRequest {
  customerName?: string;
  storeId?: number;
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE';
  discountType: 'amount' | 'percentage';
  discountValue: number;
  taxRate: number;
  amountReceived: number;
  items: SaleCreateItem[];
}

export interface SaleResponseItem {
  productId: number;
  productName: string;
  sku: string;
  batchId: number;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleResponse {
  id: number;
  invoiceNumber: string;
  customerName: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  discountType: string;
  discountValue: number;
  tax: number;
  total: number;
  amountReceived: number;
  changeAmount: number;
  status: string;
  createdAt: string;
  cashierId?: number | null;
  cashierName?: string | null;
  storeId?: number | null;
  storeName?: string | null;
  storeCode?: string | null;
  items: SaleResponseItem[];
}

export interface SaleReturnCreateRequest {
  requestKey: string;
  reason: string;
  items: Array<{
    batchId: number;
    quantity: number;
  }>;
}

export interface SaleReturnResponse {
  id: number;
  refundNumber: string;
  saleId: number;
  invoiceNumber: string;
  customerName: string;
  reason: string;
  refundAmount: number;
  status: string;
  createdAt: string;
  cashierId: number | null;
  cashierName: string | null;
  items: Array<{
    returnItemId: number;
    productId: number;
    productName: string;
    batchId: number;
    batchNumber: string;
    quantity: number;
    stockDisposition: string;
    refundAmount: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class SaleApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/tenants`;

  createSale(
    tenantId: number,
    request: SaleCreateRequest
  ): Observable<SaleResponse> {
    return this.http.post<SaleResponse>(
      `${this.apiUrl}/${tenantId}/sales`,
      request
    );
  }

  createReturn(
    tenantId: number,
    saleId: number,
    request: SaleReturnCreateRequest
  ): Observable<SaleReturnResponse> {
    return this.http.post<SaleReturnResponse>(
      `${this.apiUrl}/${tenantId}/sales/${saleId}/returns`,
      request
    );
  }

  listReturns(tenantId: number): Observable<SaleReturnResponse[]> {
    return this.http.get<SaleReturnResponse[]>(
      `${this.apiUrl}/${tenantId}/sales/returns`
    );
  }

  restockReturnedItem(
    tenantId: number,
    returnId: number,
    returnItemId: number
  ): Observable<SaleReturnResponse> {
    return this.http.post<SaleReturnResponse>(
      `${this.apiUrl}/${tenantId}/sales/returns/${returnId}/items/${returnItemId}/restock`,
      {}
    );
  }

  getSales(tenantId: number): Observable<SaleResponse[]> {
    return this.http.get<SaleResponse[]>(
      `${this.apiUrl}/${tenantId}/sales`
    );
  }
}
