export interface Customer {
  id: string;

  name: string;
  phone: string;
  email?: string;

  address?: string;
  city?: string;

  customerType: 'Regular' | 'Wholesale' | 'Corporate';

  creditLimit?: number;
  outstandingBalance?: number;

  isActive: boolean;

  createdAt: Date;
  updatedAt?: Date;
}