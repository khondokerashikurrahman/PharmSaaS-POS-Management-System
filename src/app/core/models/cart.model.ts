export interface Cart {
  id: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  totalAmount: number;
  status: 'Active' | 'Held' | 'Completed' | 'Cancelled';
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;

  batchId?: string;
  batchNumber?: string;
  expiryDate?: string;

  quantity: number;
  stock?: number;

  unitPrice: number;
  discount: number;
  totalPrice: number;
}