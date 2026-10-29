export type PurchaseOrderStatus =
  | 'Draft'
  | 'Pending'
  | 'Approved'
  | 'Partially Received'
  | 'Received'
  | 'Cancelled';

export interface PurchaseOrderItem {
  id: string;

  medicineId: string;

  batchId?: string;

  quantity: number;

  unitPrice: number;

  discount?: number;

  tax?: number;

  total: number;
}

export interface PurchaseOrder {
  id: string;

  orderNumber: string;

  supplierId?: string | number | null;

  branchId?: string;

  orderDate: string;

  expectedDeliveryDate?: string;

  items: PurchaseOrderItem[];

  subtotal: number;

  discount?: number;

  tax?: number;

  totalAmount: number;

  status: PurchaseOrderStatus;

  notes?: string;

  createdBy: string;

  approvedBy?: string;

  approvedAt?: string;

  createdAt?: string;

  updatedAt?: string;
}