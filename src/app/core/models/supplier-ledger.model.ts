export interface SupplierLedger {
  id: string;

  supplierId: string;
  supplierName: string;

  transactionDate: Date;

  transactionType: 'Purchase' | 'Payment' | 'Return' | 'Adjustment';

  referenceId?: string;
  description?: string;

  debit: number;
  credit: number;

  balance: number;

  createdAt: Date;
  updatedAt?: Date;
}