export interface Subscription {
  id: string;

  tenantId: string;
  tenantName: string;

  planId: string;
  planName: string;

  startDate: Date;
  endDate: Date;

  billingCycle: 'Monthly' | 'Yearly';

  amount: number;

  status: 'Active' | 'Pending' | 'Expired' | 'Cancelled';

  autoRenew: boolean;

  paymentStatus: 'Paid' | 'Pending' | 'Failed';

  createdAt: Date;
  updatedAt?: Date;
}