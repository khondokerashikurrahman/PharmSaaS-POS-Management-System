export type StockStatus =
  | 'In Stock'
  | 'Low Stock'
  | 'Out of Stock'
  | 'Expired';

export interface Stock {
  id: string;

  medicineId: string;

  batchId: string;

  branchId?: string;

  quantity: number;

  availableQuantity: number;

  reservedQuantity?: number;

  reorderLevel: number;

  status: StockStatus;

  lastUpdated?: string;

  createdAt?: string;

  updatedAt?: string;
}