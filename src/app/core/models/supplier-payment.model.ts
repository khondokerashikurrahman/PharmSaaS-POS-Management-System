export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;

  paymentDate: Date;
  amount: number;

  paymentMethod: 'Cash' | 'Bank' | 'Card' | 'Mobile Banking';

  referenceNumber?: string;
  notes?: string;

  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}