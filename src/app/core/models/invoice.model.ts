export interface Invoice {
  id: string;

  invoiceNumber: string;

  saleId: string;

  customerId?: string;
  customerName?: string;
  customerPhone?: string;

  invoiceDate: Date;

  items: InvoiceItem[];

  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;

  paidAmount: number;
  dueAmount: number;

  paymentStatus: 'Paid' | 'Partial' | 'Due';

  status: 'Issued' | 'Cancelled' | 'Returned';

  branchId: string;
  branchName: string;

  issuedBy: string;

  notes?: string;

  createdAt: Date;
  updatedAt?: Date;
}

export interface InvoiceItem {
  id: string;

  productId: string;
  productName: string;

  batchId?: string;
  batchNumber?: string;

  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  totalPrice: number;
}