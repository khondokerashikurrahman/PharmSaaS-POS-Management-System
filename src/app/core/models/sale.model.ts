export interface Sale {
  id: string;

  invoiceNumber: string;

  customerId?: string;
  customerName?: string;

  saleDate: Date;

  items: SaleItem[];

  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;

  paymentStatus: 'Paid' | 'Partial' | 'Due';
  paymentMethod?: 'Cash' | 'Card' | 'Bank' | 'Mobile Banking';

  status: 'Completed' | 'Pending' | 'Cancelled' | 'Returned';

  soldBy: string;
  branchId: string;
  branchName: string;

  notes?: string;

  createdAt: Date;
  updatedAt?: Date;
}

export interface SaleItem {
  id: string;

  productId: string;
  productName: string;

  batchId?: string;
  batchNumber?: string;

  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
}