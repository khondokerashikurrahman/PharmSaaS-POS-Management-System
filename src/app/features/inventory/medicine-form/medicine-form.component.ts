import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TenantInventoryApiService } from '../../../core/services/tenant-inventory-api.service';
import { ProductGenericApiService, ProductGeneric } from '../../../core/services/product-generic-api.service';
import { ProductCategoryApiService, ProductCategory } from '../../../core/services/product-category-api.service';
import { CompanyApiService, ManufacturerCompany } from '../../../core/services/company-api.service';
import { DosageFormApiService, ProductDosageForm } from '../../../core/services/dosage-form-api.service';

interface Medicine {
  categoryId?: number | null;
  genericId?: number | null;
  dosageFormId?: number | null;
  companyId?: number | null;

  id: number;
  productType: string;
  name: string;
  generic: string;
  company: string;
  category: string;
  strength: string;
  dosageForm: string;
  unitPrice: number;
  stock: number;
  reorderLevel: number;
  description: string;
  sku?: string;
  purchasePrice?: number;
  barcode?: string;
}

@Component({
  selector: 'app-medicine-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medicine-form.component.html',
  styleUrl: './medicine-form.component.scss'
})
export class MedicineFormComponent implements OnInit {
  private inventoryApi = inject(TenantInventoryApiService);
  private genericApi = inject(ProductGenericApiService);
  genericNames: string[] = [];
  private categoryApi = inject(ProductCategoryApiService);
  private companyApi = inject(CompanyApiService);
  private dosageFormApi = inject(DosageFormApiService);
  companyNames: string[] = [];
  categoryRecords: ProductCategory[] = [];
  genericRecords: ProductGeneric[] = [];
  dosageRecords: ProductDosageForm[] = [];
  companyRecords: ManufacturerCompany[] = [];

  isEditMode = false;
  isProductMode = false;
  saving = false;
  categoryOptions: string[] = [];

  readonly productTypes = [
    'MEDICINE',
    'OTC',
    'COSMETICS',
    'BABY_CARE',
    'PERSONAL_CARE',
    'MEDICAL_DEVICE',
    'HYGIENE',
    'GENERAL',
    'OTHER'
  ];

  dosageForms: string[] = [
    'Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection',
    'Cream', 'Ointment', 'Gel', 'Lotion', 'Drops', 'Eye Drops',
    'Ear Drops', 'Nasal Drops', 'Inhaler', 'Spray', 'Powder',
    'Solution', 'Sachet', 'Suppository', 'Patch', 'Other'
  ];

  readonly categoriesByProductType: Record<string, string[]> = {
    MEDICINE: [
      'Pain Relief', 'Gastric', 'Diabetes', 'Allergy',
      'Antibiotic', 'Vitamin & Supplement', 'Cardiovascular', 'Other'
    ],
    OTC: [
      'Cold & Flu', 'Pain Relief', 'Digestive Health',
      'Oral Care', 'First Aid', 'Vitamin & Supplement', 'Other'
    ],
    COSMETICS: [
      'Skin Care', 'Hair Care', 'Makeup', 'Fragrance', 'Other'
    ],
    BABY_CARE: [
      'Baby Food', 'Diapers', 'Baby Skin Care', 'Feeding', 'Other'
    ],
    PERSONAL_CARE: [
      'Skin Care', 'Hair Care', 'Oral Care', 'Body Care', 'Other'
    ],
    MEDICAL_DEVICE: [
      'Diagnostic', 'Monitoring', 'First Aid', 'Mobility', 'Other'
    ],
    HYGIENE: [
      'Sanitary Care', 'Disinfectant', 'Masks', 'Gloves', 'Other'
    ],
    GENERAL: [
      'General Goods', 'Snacks', 'Household', 'Other'
    ],
    OTHER: ['Other']
  };

  medicine: Medicine = this.emptyProduct();

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  private emptyProduct(): Medicine {
    return {
      id: 0,
      productType: 'MEDICINE',
      name: '',
      generic: '',
      company: '',
      category: '',
      strength: '',
      dosageForm: '',
      unitPrice: 0,
      stock: 0,
      reorderLevel: 10,
      description: '',
      sku: '',
      purchasePrice: 0,
      barcode: ''
    };
  }

    private loadDosageForms(): void {
    const tenantId = Number(localStorage.getItem('tenantId') || 0);
    if (!tenantId) return;

    this.dosageFormApi.list(tenantId).subscribe({
      next: forms => {
        this.dosageRecords = forms || [];
        const names = this.dosageRecords.map(form => form.name);
        const current = this.medicine.dosageForm;

        this.dosageForms = names.length ? names : this.dosageForms;
        if (current && !this.dosageForms.includes(current)) {
          this.dosageForms = [...this.dosageForms, current];
        }
      },
      error: error => {
        console.error('Could not load dosage forms from API', error);
      }
    });
  }

    private loadCompanyNames(): void {
    const tenantId = Number(localStorage.getItem('tenantId') || 0);
    if (!tenantId) return;

    this.companyApi.list(tenantId).subscribe({
      next: companies => {
        this.companyRecords = (companies || []).filter(
          company => company.status === 'Active'
        );
        this.companyNames = this.companyRecords.map(company => company.name);
      },
      error: error => {
        console.error('Could not load company names', error);
        this.companyRecords = [];
        this.companyNames = [];
      }
    });
  }

  ngOnInit(): void {
    this.loadDosageForms();
    this.loadCompanyNames();
    this.loadGenericNames();
    const productRoute = (
      this.route.snapshot.routeConfig?.path || ''
    ).startsWith('inventory/products');

    this.isProductMode =
      this.route.snapshot.queryParamMap.get('mode') === 'product'
      || productRoute;
    this.loadCategories(this.medicine.productType);

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEditMode = true;
      this.loadMedicine(Number(id));
    }
  }

    private loadGenericNames(): void {
    const tenantId = Number(localStorage.getItem('tenantId') || 0);
    if (!tenantId) return;

    this.genericApi.list(tenantId).subscribe({
      next: items => {
        this.genericRecords = items || [];
        this.genericNames = this.genericRecords.map(item => item.name);
      },
      error: error => {
        console.error('Could not load generic names', error);
        this.genericRecords = [];
        this.genericNames = [];
      }
    });
  }

  onCategoryNameChange(name: string): void {
    const selected = this.categoryRecords.find(
      item => item.name.trim().toLowerCase() === (name || '').trim().toLowerCase()
    );
    this.medicine.categoryId = selected?.id ?? null;
  }

  onGenericNameChange(name: string): void {
    const selected = this.genericRecords.find(
      item => item.name.trim().toLowerCase() === (name || '').trim().toLowerCase()
    );
    this.medicine.genericId = selected?.id ?? null;
  }

  onDosageFormChange(name: string): void {
    const selected = this.dosageRecords.find(
      item => item.name.trim().toLowerCase() === (name || '').trim().toLowerCase()
    );
    this.medicine.dosageFormId = selected?.id ?? null;
  }

  onCompanyNameChange(name: string): void {
    const selected = this.companyRecords.find(
      item => item.name.trim().toLowerCase() === (name || '').trim().toLowerCase()
    );
    this.medicine.companyId = selected?.id ?? null;
  }

  get isMedicineLike(): boolean {
    return ['MEDICINE', 'OTC'].includes(this.medicine.productType);
  }

  get pageTitle(): string {
    if (this.isProductMode) {
      return this.isEditMode ? 'Edit Product' : 'Add Product';
    }
    return this.isEditMode ? 'Edit Medicine' : 'Add Medicine';
  }

  get pageDescription(): string {
    return this.isEditMode
      ? 'Update product information. Stock quantities are managed separately.'
      : 'Add a product to your shared pharmacy inventory.';
  }

  get categories(): string[] {
    const fallback =
      this.categoriesByProductType[this.medicine.productType] ||
      this.categoriesByProductType['OTHER'];
    const choices = this.categoryOptions.length
      ? this.categoryOptions
      : fallback;

    // Preserve older category values when editing legacy products.
    if (this.medicine.category && !choices.includes(this.medicine.category)) {
      return [...choices, this.medicine.category];
    }
    return choices;
  }

    private loadCategories(productType: string): void {
    const tenantId = this.getTenantId();
    if (!tenantId) return;

    this.categoryApi.list(tenantId, productType).subscribe({
      next: categories => {
        this.categoryRecords = categories || [];
        this.categoryOptions = this.categoryRecords.map(category => category.name);
      },
      error: error => {
        console.error('Could not load categories from API', error);
        this.categoryRecords = [];
        this.categoryOptions = [];
      }
    });
  }

  getProductTypeLabel(type: string): string {
    return (type || 'MEDICINE').replace(/_/g, ' ');
  }

  onProductTypeChange(type: string): void {
    const validType = this.productTypes.includes(type) ? type : 'OTHER';
    this.medicine.productType = validType;
    this.medicine.category = '';
    this.medicine.categoryId = null;
    this.categoryOptions = [];
    this.loadCategories(validType);

    if (!['MEDICINE', 'OTC'].includes(validType)) {
      this.medicine.generic = '';
      this.medicine.strength = '';
      this.medicine.dosageForm = '';
      this.isProductMode = true;
    }
  }

  private getTenantId(): number {
    const stored = Number(
      localStorage.getItem('tenantId') ||
      localStorage.getItem('tenant_id') ||
      0
    );
    if (Number.isSafeInteger(stored) && stored > 0) return stored;

    try {
      const user = JSON.parse(localStorage.getItem('pharm_user') || '{}');
      const id = Number(user.tenantId || user.tenant_id || user.tenant?.id || 0);
      return Number.isSafeInteger(id) && id > 0 ? id : 0;
    } catch {
      return 0;
    }
  }

  loadMedicine(id: number): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      alert('Tenant ID পাওয়া যায়নি। আবার login করো।');
      this.cancel();
      return;
    }

    this.inventoryApi.get(tenantId, id).subscribe({
      next: item => {
        const type = String(item.productType || 'MEDICINE').toUpperCase();
        const validType = this.productTypes.includes(type) ? type : 'OTHER';
        const rawCategory = String(item.category || '').trim();

        // Correct legacy records where dosage form was stored as category.
        const oldDosage = validType === 'MEDICINE'
          ? this.dosageForms.find(
              form => form.toLowerCase() === rawCategory.toLowerCase()
            )
          : undefined;

        this.medicine = {
          id: item.id,
          productType: validType,
          name: item.name || '',
          generic: item.genericName || '',
          company: item.brandName || '',
          category: oldDosage ? 'Other' : (rawCategory || ''),
          categoryId: item.categoryId ?? null,
          genericId: item.genericId ?? null,
          dosageFormId: item.dosageFormId ?? null,
          companyId: item.companyId ?? null,
          strength: item.strength || '',
          dosageForm: item.dosageForm || oldDosage || '',
          unitPrice: Number(item.sellingPrice || 0),
          stock: Number(item.stockQuantity || 0),
          reorderLevel: Number(item.reorderLevel || 0),
          description: item.description || '',
          sku: item.sku || '',
          purchasePrice: Number(item.purchasePrice || 0),
          barcode: item.barcode || ''
        };

        this.loadCategories(validType);

        if (validType !== 'MEDICINE') {
          this.isProductMode = true;
        }
      },
      error: err => {
        console.error('Failed to load product', err);
        alert(
          err?.error?.detail ||
          err?.error?.message ||
          'Product পাওয়া যায়নি বা permission নেই।'
        );
        this.cancel();
      }
    });
  }

  saveMedicine(): void {
    if (this.saving) return;

    if (!this.medicine.name.trim()) {
      alert('Product name লিখো।');
      return;
    }

    if (!this.productTypes.includes(this.medicine.productType)) {
      alert('সঠিক Product Type নির্বাচন করো।');
      return;
    }

    if (this.isMedicineLike && !this.medicine.generic.trim()) {
      alert('Medicine/OTC-এর Generic Name লিখো।');
      return;
    }

    if (this.isMedicineLike && !this.medicine.dosageForm) {
      alert('Medicine/OTC-এর Dosage Form নির্বাচন করো।');
      return;
    }

    if (!this.medicine.category) {
      alert('Product Type অনুযায়ী Category নির্বাচন করো।');
      return;
    }

    const matchName = (a: string, b: string) =>
      (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

    const selectedCategory = this.categoryRecords.find(
      item => matchName(item.name, this.medicine.category)
    );
    const selectedGeneric = this.genericRecords.find(
      item => matchName(item.name, this.medicine.generic)
    );
    const selectedDosage = this.dosageRecords.find(
      item => matchName(item.name, this.medicine.dosageForm)
    );
    const selectedCompany = this.companyRecords.find(
      item => matchName(item.name, this.medicine.company)
    );

    if (!this.isEditMode && !selectedCategory) {
      alert('Category Master থেকে একটি active Category নির্বাচন করো।');
      return;
    }
    if (!this.isEditMode && this.isMedicineLike && !selectedGeneric) {
      alert('আগে Generic Master-এ নাম যোগ করে সেখান থেকে নির্বাচন করো।');
      return;
    }
    if (!this.isEditMode && this.isMedicineLike && !selectedDosage) {
      alert('Dosage Form Master থেকে একটি active Dosage Form নির্বাচন করো।');
      return;
    }
    if (!this.isEditMode && this.medicine.company.trim() && !selectedCompany) {
      alert('Company Master থেকে Company নির্বাচন করো, অথবা field ফাঁকা রাখো।');
      return;
    }

    if (!Number.isFinite(Number(this.medicine.unitPrice)) ||
        Number(this.medicine.unitPrice) <= 0) {
      alert('সঠিক Sale Price লিখো।');
      return;
    }

    const tenantId = this.getTenantId();
    if (!tenantId) {
      alert('Tenant ID পাওয়া যায়নি। আবার login করো।');
      return;
    }

    const productType = this.medicine.productType;
    const request = {
      productType,
      name: this.medicine.name.trim(),
      genericName: this.isMedicineLike ? this.medicine.generic.trim() : '',
      brandName: this.medicine.company.trim(),
      strength: this.isMedicineLike ? this.medicine.strength.trim() : '',
      dosageForm: this.isMedicineLike ? this.medicine.dosageForm : '',
      category: this.medicine.category,
      categoryId: selectedCategory?.id ?? null,
      genericId: this.isMedicineLike ? (selectedGeneric?.id ?? null) : null,
      dosageFormId: this.isMedicineLike ? (selectedDosage?.id ?? null) : null,
      companyId: selectedCompany?.id ?? null,
      description: this.medicine.description?.trim() || '',
      sku: this.medicine.sku?.trim() ||
        `${productType === 'MEDICINE' ? 'MED' : 'PRD'}-${Date.now()}`,
      barcode: this.medicine.barcode?.trim() || '',
      purchasePrice: Math.max(0, Number(this.medicine.purchasePrice || 0)),
      sellingPrice: Number(this.medicine.unitPrice),
      stockQuantity: Number(this.medicine.stock || 0),
      reorderLevel: Math.max(0, Number(this.medicine.reorderLevel || 0)),
      status: 'ACTIVE' as const
    };

    this.saving = true;

    const save$ = this.isEditMode
      ? this.inventoryApi.update(tenantId, this.medicine.id, request)
      : this.inventoryApi.create(tenantId, request);

    save$.subscribe({
      next: saved => {
        this.medicine.id = saved.id;
        this.saving = false;

        alert(this.isEditMode
          ? 'Product updated successfully.'
          : 'Product added successfully.');

        this.router.navigate([
          this.isProductMode
            ? '/app/inventory/products'
            : '/app/inventory/medicines'
        ]);
      },
      error: err => {
        console.error('Failed to save product', err);
        this.saving = false;
        alert(
          err?.error?.detail ||
          err?.error?.message ||
          'Backend-এ Product save করা যায়নি।'
        );
      }
    });
  }

  resetForm(): void {
    if (this.isEditMode && this.medicine.id) {
      this.loadMedicine(this.medicine.id);
      return;
    }

    this.medicine = this.emptyProduct();
  }

  cancel(): void {
    this.router.navigate([
      this.isProductMode
        ? '/app/inventory/products'
        : '/app/inventory/medicines'
    ]);
  }
}
