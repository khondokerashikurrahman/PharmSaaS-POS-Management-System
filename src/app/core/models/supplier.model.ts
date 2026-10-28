export type SupplierStatus =
  | 'Active'
  | 'Inactive'
  | 'Blocked';

export interface Supplier {
  id: string;

  name: string;

  contactPerson: string;

  phone: string;

  email?: string;

  address: string;

  companyName?: string;

  openingBalance?: number;

  creditLimit?: number;

  status: SupplierStatus;

  createdAt?: string;

  updatedAt?: string;
}