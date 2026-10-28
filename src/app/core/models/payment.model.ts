export interface Payment {
  id: string;

  saleId: string;
  invoiceNumber?: string;

  amount: number;

  paymentMethod: 'Cash' | 'Card' | 'Bank' | 'Mobile Banking';

  paymentDate: Date;

  referenceNumber?: string;
  transactionId?: string;

  status: 'Pending' | 'Completed' | 'Failed' | 'Refunded';

  notes?: string;

  receivedBy: string;

  createdAt: Date;
  updatedAt?: Date;
}