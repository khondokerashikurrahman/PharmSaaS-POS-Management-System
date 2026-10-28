import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantInventoryApiService } from '../../../core/services/tenant-inventory-api.service';

interface StockItem {
  id: string;
  medicine: string;
  genericName: string;
  category: string;
  company: string;
  stock: number;
  reorderLevel: number;
  purchasePrice: number;
  salePrice: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

interface CategoryStock {
  category: string;
  products: number;
  quantity: number;
  value: number;
}

@Component({
  selector: 'app-stock-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-overview.component.html',
  styleUrl: './stock-overview.component.scss'
})
export class StockOverviewComponent implements OnInit {
  searchTerm = '';
  stockItems: StockItem[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private readonly inventoryApi: TenantInventoryApiService
  ) {}

  ngOnInit(): void {
    this.loadStock();
  }

  private getTenantId(): number {
    const id = Number(localStorage.getItem('tenantId'));
    return Number.isSafeInteger(id) && id > 0 ? id : 0;
  }

  loadStock(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.stockItems = [];
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করুন।';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.inventoryApi.list(tenantId).subscribe({
      next: items => {
        this.stockItems = (Array.isArray(items) ? items : []).map(item => {
          const stock = Number(item.stockQuantity ?? 0);
          const reorderLevel = Number(item.reorderLevel ?? 0);

          return {
            id: item.sku || String(item.id),
            medicine: item.name || 'Unnamed medicine',
            genericName: item.genericName || '',
            category: item.category || 'Other',
            company: item.brandName || 'Not specified',
            stock,
            reorderLevel,
            purchasePrice: Number(item.purchasePrice ?? 0),
            salePrice: Number(item.sellingPrice ?? 0),
            status: this.getMedicineStatus(stock, reorderLevel)
          };
        });

        this.loading = false;
      },
      error: error => {
        console.error('Failed to load stock overview:', error);
        this.stockItems = [];
        this.loading = false;
        this.errorMessage =
          error?.error?.message ||
          'Backend থেকে inventory data load করা যায়নি। Connection ও login পরীক্ষা করুন।';
      }
    });
  }

  get categoryStock(): CategoryStock[] {
    const categories = new Map<string, CategoryStock>();

    for (const item of this.stockItems) {
      let entry = categories.get(item.category);

      if (!entry) {
        entry = {
          category: item.category,
          products: 0,
          quantity: 0,
          value: 0
        };
        categories.set(item.category, entry);
      }

      entry.products += 1;
      entry.quantity += item.stock;
      entry.value += item.stock * item.purchasePrice;
    }

    return Array.from(categories.values())
      .sort((a, b) => b.quantity - a.quantity);
  }

  get totalStock(): number {
    return this.stockItems.reduce(
      (total, item) => total + item.stock, 0
    );
  }

  get totalStockValue(): number {
    return this.stockItems.reduce(
      (total, item) => total + item.stock * item.purchasePrice, 0
    );
  }

  get lowStockCount(): number {
    return this.stockItems.filter(
      item => item.status === 'Low Stock'
    ).length;
  }

  get outOfStockCount(): number {
    return this.stockItems.filter(
      item => item.status === 'Out of Stock'
    ).length;
  }

  get inStockCount(): number {
    return this.stockItems.filter(
      item => item.status === 'In Stock'
    ).length;
  }

  get inventoryHealthPercentage(): number {
    if (this.stockItems.length === 0) return 0;

    return Math.round(
      (this.inStockCount / this.stockItems.length) * 100
    );
  }

  get filteredStockItems(): StockItem[] {
    const search = this.searchTerm.trim().toLowerCase();

    if (!search) return this.stockItems;

    return this.stockItems.filter(item =>
      item.medicine.toLowerCase().includes(search) ||
      item.genericName.toLowerCase().includes(search) ||
      item.company.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search) ||
      item.id.toLowerCase().includes(search)
    );
  }

  getStockPercentage(item: StockItem): number {
    if (item.stock <= 0) return 0;
    if (item.reorderLevel <= 0) return 100;

    return Math.min(
      100,
      (item.stock / (item.reorderLevel * 4)) * 100
    );
  }

  getMedicineStatus(
    stock: number,
    reorderLevel: number
  ): StockItem['status'] {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= reorderLevel) return 'Low Stock';
    return 'In Stock';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'In Stock':
        return 'status-in-stock';
      case 'Low Stock':
        return 'status-low-stock';
      case 'Out of Stock':
        return 'status-out-stock';
      default:
        return '';
    }
  }
}
