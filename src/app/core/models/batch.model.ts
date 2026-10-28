export type BatchStatus =
  | 'Available'
  | 'Low Stock'
  | 'Expired'
  | 'Near Expiry'
  | 'Inactive';

export interface Batch {
  id: string;

  tenantId: string;
  branchId: string;

  medicineId: string;

  batchNumber: string;

  manufacturingDate: string;
  expiryDate: string;

  purchasePrice: number;
  sellingPrice: number;

  quantity: number;
  availableQuantity: number;

  reorderLevel: number;

  supplierId?: string;

  status: BatchStatus;

  createdAt?: string;
  updatedAt?: string;
}