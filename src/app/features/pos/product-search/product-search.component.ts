import {
  Component,
  EventEmitter,
  OnInit,
  Output
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Product } from '../../../core/models/product.model';
import {
  TenantInventoryApiService,
  TenantInventoryItem
} from '../../../core/services/tenant-inventory-api.service';

@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './product-search.component.html',
  styleUrl: './product-search.component.scss'
})
export class ProductSearchComponent implements OnInit {

  @Output()
  productSelected = new EventEmitter<Product>();

  searchTerm = '';

  products: Product[] = [];

  loading = false;

  errorMessage = '';

  constructor(
    private inventoryApi: TenantInventoryApiService
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  private getTenantId(): number | null {
    const storedTenantId = localStorage.getItem('tenantId');

    if (storedTenantId) {
      const id = Number(storedTenantId);

      if (Number.isInteger(id) && id > 0) {
        return id;
      }
    }

    // Fallback: check the saved login user.
    try {
      const savedUser = localStorage.getItem('pharm_user');

      if (savedUser) {
        const user = JSON.parse(savedUser);
        const id = Number(user.tenantId);

        if (Number.isInteger(id) && id > 0) {
          return id;
        }
      }
    } catch {
      // Invalid saved user data.
    }

    return null;
  }

  loadInventory(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.errorMessage =
        'Tenant ID পাওয়া যায়নি। আবার login করে POS খুলুন.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.inventoryApi.list(tenantId).subscribe({
      next: (items: TenantInventoryItem[]) => {
        this.products = (items ?? [])
          .filter(item =>
            String(item.status).toUpperCase() === 'ACTIVE'
          )
          .map(item => ({
            id: String(item.id),
            medicineId: String(item.id),
            name: item.name,
            sku: item.sku ?? '',
            barcode: item.barcode ?? '',
            category:
              item.genericName ||
              item.dosageForm ||
              'Medicine',
            unit: item.dosageForm || 'Unit',
            purchasePrice: Number(item.purchasePrice ?? 0),
            sellingPrice: Number(item.sellingPrice ?? 0),
            status: 'Active' as const,
            stock: Number(item.stockQuantity ?? 0)
          } as Product));

        this.loading = false;
      },

      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.status === 401 || error?.status === 403
            ? 'Login বা permission সমস্যা হয়েছে। আবার login করে চেষ্টা করুন.'
            : 'Backend থেকে Inventory লোড করা যায়নি। Backend চালু আছে কি না পরীক্ষা করুন.';

        console.error(
          'Failed to load tenant inventory:',
          error
        );
      }
    });
  }

  get filteredProducts(): Product[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.products;
    }

    return this.products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term) ||
      (product.barcode ?? '').toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  }

  onSearchEnter(): void {
    const term = this.searchTerm.trim();

    if (!term) {
      return;
    }

    // Barcode scanner sends the barcode followed by Enter.
    const exactBarcode = this.products.find(product =>
      (product.barcode ?? '').trim() === term
    );

    if (exactBarcode) {
      this.selectProduct(exactBarcode);
      this.clearSearch();
      return;
    }

    // For manual search, Enter selects only an unambiguous result.
    const matches = this.filteredProducts;

    if (matches.length === 1) {
      this.selectProduct(matches[0]);
      this.clearSearch();
    }
  }

  selectProduct(product: Product): void {
    this.productSelected.emit(product);
  }

  clearSearch(): void {
    this.searchTerm = '';
  }
}
