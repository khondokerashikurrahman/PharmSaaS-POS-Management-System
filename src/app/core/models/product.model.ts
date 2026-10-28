export type ProductStatus =
  | 'Active'
  | 'Inactive';

export interface Product {
  id: string;

  medicineId: string;

  name: string;

  sku: string;

  barcode?: string;

  stock?: number;

  category: string;

  unit: string;

  purchasePrice: number;

  sellingPrice: number;

  taxRate?: number;

  discountRate?: number;

  status: ProductStatus;

  createdAt?: string;

  updatedAt?: string;
}