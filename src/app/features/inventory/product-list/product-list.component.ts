import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TenantInventoryApiService } from '../../../core/services/tenant-inventory-api.service';

interface Product {
  id: number;
  name: string;
  genericName: string;
  productType: string;
  category: string;
  dosageForm: string;
  company: string;
  stock: number;
  purchasePrice: number;
  salePrice: number;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  searchTerm = '';
  selectedCategory = 'All';
  selectedStatus = 'All';
  selectedProductType = 'All';

  products: Product[] = [];
  loading = false;
  errorMessage = '';

  readonly productTypeOptions = [
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

  private readonly legacyDosageForms = [
    'Tablet', 'Capsule', 'Syrup', 'Injection',
    'Cream', 'Ointment', 'Drops', 'Inhaler'
  ];

  constructor(
    private router: Router,
    private inventoryApi: TenantInventoryApiService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  private getTenantId(): number {
    const direct = Number(
      localStorage.getItem('tenantId') ||
      localStorage.getItem('tenant_id') ||
      0
    );
    if (Number.isSafeInteger(direct) && direct > 0) return direct;

    try {
      const user = JSON.parse(localStorage.getItem('pharm_user') || '{}');
      const id = Number(user.tenantId || user.tenant_id || user.tenant?.id || 0);
      return Number.isSafeInteger(id) && id > 0 ? id : 0;
    } catch {
      return 0;
    }
  }

  loadProducts(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করো।';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.inventoryApi.list(tenantId).subscribe({
      next: items => {
        this.products = (items || []).map(item => {
          const productType = String(item.productType || 'MEDICINE').toUpperCase();
          const rawCategory = String(item.category || '').trim();
          const legacyForm = this.legacyDosageForms.find(
            form => form.toLowerCase() === rawCategory.toLowerCase()
          );

          // Older medicine records may have "Tablet" stored as category.
          // Present it as dosage form instead; save the corrected category on edit.
          const category =
            productType === 'MEDICINE' && legacyForm
              ? 'Other'
              : rawCategory || 'Other';

          const dosageForm = String(item.dosageForm || legacyForm || '');
          const stock = Number(item.stockQuantity || 0);
          const reorder = Number(item.reorderLevel || 0);

          return {
            id: Number(item.id),
            name: item.name || '',
            genericName: item.genericName || '',
            productType,
            category,
            dosageForm,
            company: item.brandName || '',
            stock,
            purchasePrice: Number(item.purchasePrice || 0),
            salePrice: Number(item.sellingPrice || 0),
            reorderLevel: reorder,
            status: stock <= 0
              ? 'Out of Stock'
              : stock <= reorder
                ? 'Low Stock'
                : 'In Stock'
          } as Product;
        });

        this.loading = false;
      },
      error: error => {
        console.error('Failed to load products', error);
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          (error?.status === 401 || error?.status === 403
            ? 'Login বা permission সমস্যা হয়েছে। আবার login করে চেষ্টা করো।'
            : 'Backend থেকে Product List লোড করা যায়নি।');
        this.loading = false;
      }
    });
  }

  get categories(): string[] {
    return [
      'All',
      ...Array.from(new Set(this.products.map(p => p.category).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
    ];
  }

  get productTypes(): string[] {
    const found = this.products.map(p => p.productType).filter(Boolean);
    return [
      'All',
      ...this.productTypeOptions.filter(type => found.includes(type))
    ];
  }

  get filteredProducts(): Product[] {
    const search = this.searchTerm.trim().toLowerCase();

    return this.products.filter(product => {
      const searchable = [
        product.name,
        product.genericName,
        product.category,
        product.dosageForm,
        product.company,
        product.productType,
        String(product.id)
      ].join(' ').toLowerCase();

      return (!search || searchable.includes(search)) &&
        (this.selectedCategory === 'All' ||
          product.category === this.selectedCategory) &&
        (this.selectedStatus === 'All' ||
          product.status === this.selectedStatus) &&
        (this.selectedProductType === 'All' ||
          product.productType === this.selectedProductType);
    });
  }

  get totalProducts(): number {
    return this.products.length;
  }

  get totalStock(): number {
    return this.products.reduce((sum, product) => sum + product.stock, 0);
  }

  get lowStockProducts(): number {
    return this.products.filter(p => p.status === 'Low Stock').length;
  }

  get outOfStockProducts(): number {
    return this.products.filter(p => p.status === 'Out of Stock').length;
  }

  getProductTypeLabel(type: string): string {
    return (type || 'MEDICINE').replace(/_/g, ' ');
  }

  getStatusClass(status: Product['status']): string {
    switch (status) {
      case 'In Stock': return 'in-stock';
      case 'Low Stock': return 'low-stock';
      case 'Out of Stock': return 'out-of-stock';
      default: return '';
    }
  }

  addProduct(): void {
    this.router.navigate(['/app/inventory/products/new']);
  }

  editProduct(product: Product): void {
    this.router.navigate(['/app/inventory/products', product.id, 'edit']);
  }

  viewProduct(product: Product): void {
    this.router.navigate(
      ['/app/inventory/medicines', product.id],
      { queryParams: { mode: 'product' } }
    );
  }

  trackByProductId(index: number, product: Product): number {
    return product.id;
  }
}
