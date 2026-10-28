export type PurchaseReturnStatus =
  | 'Draft'
  | 'Pending'
  | 'Approved'
  | 'Completed'
  | 'Cancelled';

export interface PurchaseReturnItem {
  id: string;

  medicineId: string;

  batchId: string;

  quantity: number;

  unitPrice: number;

  discount?: number;

  tax?: number;

  total: number;

  reason?: string;
}

export interface PurchaseReturn {
  id: string;

  returnNumber: string;

  purchaseOrderId?: string;

  grnId?: string;

  supplierId: string;

  branchId?: string;

  returnDate: string;

  items: PurchaseReturnItem[];

  subtotal: number;

  discount?: number;

  tax?: number;

  totalAmount: number;

  status: PurchaseReturnStatus;

  reason?: string;

  notes?: string;

  returnedBy: string;

  approvedBy?: string;

  approvedAt?: string;

  createdAt?: string;

  updatedAt?: string;
}