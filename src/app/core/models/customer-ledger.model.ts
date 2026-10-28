export interface CustomerLedger {
  id: string;

  customerId: string;
  customerName: string;

  transactionDate: Date;

  transactionType: 'Sale' | 'Payment' | 'Return' | 'Adjustment';

  referenceId?: string;
  description?: string;

  debit: number;
  credit: number;

  balance: number;

  createdAt: Date;
  updatedAt?: Date;
}