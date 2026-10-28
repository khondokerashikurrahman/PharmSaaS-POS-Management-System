export interface BranchTransfer {
  id: string;

  fromBranchId: string;
  fromBranchName: string;

  toBranchId: string;
  toBranchName: string;

  transferDate: Date;

  status: 'Pending' | 'Approved' | 'In Transit' | 'Completed' | 'Cancelled';

  totalItems: number;
  totalQuantity: number;

  notes?: string;

  requestedBy: string;
  approvedBy?: string;

  createdAt: Date;
  updatedAt?: Date;
}