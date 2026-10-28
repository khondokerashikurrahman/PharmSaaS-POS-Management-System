export type SalesmanStatus =
  | 'Active'
  | 'Inactive';

export interface Salesman {
  id: string;

  name: string;

  employeeId: string;

  phone: string;

  email?: string;

  address?: string;

  territory?: string;

  commissionRate?: number;

  status: SalesmanStatus;

  createdAt?: string;

  updatedAt?: string;
}