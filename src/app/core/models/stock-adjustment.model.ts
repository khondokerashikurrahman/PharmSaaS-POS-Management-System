export type StockAdjustmentType =
  | 'Increase'
  | 'Decrease';

export type StockAdjustmentReason =
  | 'Damaged'
  | 'Expired'
  | 'Lost'
  | 'Found'
  | 'Correction'
  | 'Other';

export interface StockAdjustment {
  id: string;

  medicineId: string;

  batchId: string;

  branchId?: string;

  type: StockAdjustmentType;

  quantity: number;

  reason: StockAdjustmentReason;

  remarks?: string;

  adjustedBy: string;

  adjustmentDate: string;

  createdAt?: string;

  updatedAt?: string;
}