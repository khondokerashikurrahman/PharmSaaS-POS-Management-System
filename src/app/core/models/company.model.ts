export type CompanyStatus =
  | 'Active'
  | 'Inactive';

export interface Company {
  id: string;

  name: string;

  contactPerson: string;

  phone: string;

  email: string;

  address: string;

  status: CompanyStatus;

  createdAt?: string;

  updatedAt?: string;
}