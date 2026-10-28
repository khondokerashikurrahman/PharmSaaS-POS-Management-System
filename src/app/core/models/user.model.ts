export type UserRole =
  | 'SUPER_ADMIN'
  | 'TENANT_ADMIN'
  | 'MANAGER'
  | 'STAFF'
  | 'STORE_KEEPER';

export type MembershipRole =
  | 'SUPER_ADMIN'
  | 'TENANT_OWNER'
  | 'PHARMACY_ADMIN'
  | 'MANAGER'
  | 'STORE_KEEPER'
  | 'PHARMACIST'
  | 'STAFF'
  | 'CASHIER';

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED';

export interface User {
  id: string;
  tenantId: string | null;
  name: string;
  email: string;
  phone?: string;

  // Existing frontend navigation role.
  role?: UserRole;

  // Exact backend membership role.
  // TENANT_OWNER and PHARMACY_ADMIN must remain distinguishable.
  membershipRole?: MembershipRole;

  branchIds?: string[];
  status?: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}
