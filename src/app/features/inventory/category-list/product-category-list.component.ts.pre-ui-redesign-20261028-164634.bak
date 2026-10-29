import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ProductCategory,
  ProductCategoryApiService
} from '../../../core/services/product-category-api.service';

@Component({
  selector: 'app-product-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-category-list.component.html',
  styleUrl: './product-category-list.component.scss'
})
export class ProductCategoryListComponent implements OnInit {
  readonly productTypes = [
    'MEDICINE', 'OTC', 'COSMETICS', 'BABY_CARE',
    'PERSONAL_CARE', 'MEDICAL_DEVICE', 'HYGIENE',
    'GENERAL', 'OTHER'
  ];

  selectedProductType = 'MEDICINE';
  categories: ProductCategory[] = [];

  categoryName = '';
  editingId: number | null = null;

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(private categoryApi: ProductCategoryApiService) {}

  ngOnInit(): void {
    this.loadCategories();
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

  getProductTypeLabel(type: string): string {
    return (type || '').replace(/_/g, ' ');
  }

  onProductTypeChange(): void {
    this.cancelEdit();
    this.loadCategories();
  }

  loadCategories(): void {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করে চেষ্টা করো।';
      this.categories = [];
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.categoryApi.list(tenantId, this.selectedProductType).subscribe({
      next: categories => {
        this.categories = categories || [];
        this.loading = false;
      },
      error: error => {
        console.error('Category list failed', error);
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Category list load করা যায়নি। Backend ও login পরীক্ষা করো।';
        this.loading = false;
      }
    });
  }

  saveCategory(): void {
    const name = this.categoryName.trim();
    if (!name) {
      this.errorMessage = 'Category name লিখো।';
      return;
    }

    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি।';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = {
      productType: this.selectedProductType,
      name
    };

    const operation = this.editingId === null
      ? this.categoryApi.create(tenantId, request)
      : this.categoryApi.update(tenantId, this.editingId, request);

    operation.subscribe({
      next: () => {
        this.saving = false;
        this.categoryName = '';
        this.editingId = null;
        this.successMessage = 'Category saved successfully.';
        this.loadCategories();
      },
      error: error => {
        console.error('Category save failed', error);
        this.saving = false;
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Category save করা যায়নি। Duplicate নাম বা permission পরীক্ষা করো।';
      }
    });
  }

  editCategory(category: ProductCategory): void {
    this.editingId = category.id;
    this.categoryName = category.name;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEdit(): void {
    this.editingId = null;
    this.categoryName = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  archiveCategory(category: ProductCategory): void {
    if (!window.confirm(
      `Category "${category.name}" archive করবে? এটি active Category list থেকে সরানো হবে।`
    )) return;

    const tenantId = this.getTenantId();
    if (!tenantId) return;

    this.categoryApi.archive(tenantId, category.id).subscribe({
      next: () => {
        this.successMessage = 'Category archived.';
        if (this.editingId === category.id) this.cancelEdit();
        this.loadCategories();
      },
      error: error => {
        console.error('Category archive failed', error);
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Category archive করা যায়নি।';
      }
    });
  }

  trackById(index: number, category: ProductCategory): number {
    return category.id;
  }
}
