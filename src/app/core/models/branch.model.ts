export type BranchStatus =
  | 'ACTIVE'
  | 'INACTIVE';

export interface Branch {
  id: string;

  tenantId: string;

  name: string;
  code: string;

  address: string;

  phone?: string;
  email?: string;

  managerId?: string;

  isMainBranch: boolean;

  status: BranchStatus;

  createdAt?: string;
  updatedAt?: string;
}