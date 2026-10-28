export type MedicineStatus =
  | 'Active'
  | 'Inactive';

export interface Medicine {
  id: string;

  name: string;

  genericName: string;

  companyId: string;

  category: string;

  dosageForm: string;

  strength: string;

  sku: string;

  barcode?: string;

  unit: string;

  purchasePrice: number;

  sellingPrice: number;

  reorderLevel: number;

  status: MedicineStatus;

  createdAt?: string;

  updatedAt?: string;
}