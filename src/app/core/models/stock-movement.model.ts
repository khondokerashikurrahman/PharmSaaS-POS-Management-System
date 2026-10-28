export type StockMovementType =
  | 'Purchase'
  | 'Sale'
  | 'Purchase Return'
  | 'Sale Return'
  | 'Adjustment'
  | 'Transfer In'
  | 'Transfer Out';

export interface StockMovement {
  id: string;

  medicineId: string;

  batchId: string;

  branchId?: string;

  type: StockMovementType;

  quantity: number;

  referenceId?: string;

  referenceNumber?: string;

  previousQuantity: number;

  newQuantity: number;

  remarks?: string;

  movementDate: string;

  performedBy: string;

  createdAt?: string;

  updatedAt?: string;
}