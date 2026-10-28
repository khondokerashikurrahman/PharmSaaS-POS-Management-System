export type GrnStatus =
  | 'Draft'
  | 'Received'
  | 'Partially Received'
  | 'Cancelled';

export interface GrnItem {
  id: string;

  medicineId: string;

  batchId?: string;

  orderedQuantity: number;

  receivedQuantity: number;

  unitPrice: number;

  discount?: number;

  tax?: number;

  total: number;

  expiryDate?: string;
}

export interface Grn {
  id: string;

  grnNumber: string;

  purchaseOrderId: string;

  supplierId: string;

  branchId?: string;

  receivedDate: string;

  items: GrnItem[];

  subtotal: number;

  discount?: number;

  tax?: number;

  totalAmount: number;

  status: GrnStatus;

  notes?: string;

  receivedBy: string;

  createdAt?: string;

  updatedAt?: string;
}