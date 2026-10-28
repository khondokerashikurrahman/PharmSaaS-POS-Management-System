export interface Billing {
  id: string;

  tenantId: string;
  tenantName: string;

  subscriptionId: string;

  invoiceNumber: string;

  billingDate: Date;
  dueDate: Date;

  billingCycle: 'Monthly' | 'Yearly';

  planName: string;

  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;

  paidAmount: number;
  dueAmount: number;

  paymentMethod?: 'Cash' | 'Card' | 'Bank' | 'Mobile Banking';

  paymentStatus: 'Paid' | 'Partial' | 'Pending' | 'Failed';

  status: 'Issued' | 'Paid' | 'Overdue' | 'Cancelled';

  transactionId?: string;

  notes?: string;

  createdAt: Date;
  updatedAt?: Date;
}