import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  TenantInventoryApiService,
  TenantInventoryItem
} from '../../../core/services/tenant-inventory-api.service';

interface StockReportItem {
  id: string;
  name: string;
  genericName: string;
  category: string;
  company: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
  purchasePrice: number;
  sellingPrice: number;
  stockValue: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

@Component({
  selector: 'app-stock-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stock-report.component.html',
  styleUrl: './stock-report.component.scss'
})
export class StockReportComponent implements OnInit {
  private readonly inventoryApi = inject(TenantInventoryApiService);

  stockItems: StockReportItem[] = [];
  filteredItems: StockReportItem[] = [];

  searchTerm = '';
  selectedStatus = 'All';
  selectedCategory = 'All';

  lastUpdated = new Date();
  loading = false;

  totalProducts = 0;
  totalQuantity = 0;
  totalStockValue = 0;
  lowStockCount = 0;
  outOfStockCount = 0;
  inStockCount = 0;

  ngOnInit(): void {
    this.loadStockReport();
  }

  // Load real inventory records from the backend.
  loadStockReport(): void {
    const tenantId = Number(localStorage.getItem('tenantId'));

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      this.stockItems = [];
      this.calculateSummary();
      this.applyFilters();
      console.error('Stock Report: valid tenantId was not found.');
      alert('Tenant information is missing. Please log in and select your pharmacy again.');
      return;
    }

    this.loading = true;

    this.inventoryApi.list(tenantId).subscribe({
      next: (medicines: TenantInventoryItem[]) => {
        this.stockItems = (Array.isArray(medicines) ? medicines : [])
          .map(medicine => this.mapMedicineToStockItem(medicine));

        this.calculateSummary();
        this.applyFilters();
        this.lastUpdated = new Date();
        this.loading = false;
      },
      error: error => {
        console.error('Unable to load Stock Report from backend:', error);
        this.stockItems = [];
        this.calculateSummary();
        this.applyFilters();
        this.loading = false;
        alert('Stock Report could not be loaded. Please check your login and backend connection.');
      }
    });
  }

  private mapMedicineToStockItem(
    medicine: TenantInventoryItem
  ): StockReportItem {
    const quantity = this.getNumber(medicine.stockQuantity);
    const reorderLevel = this.getNumber(medicine.reorderLevel);
    const purchasePrice = this.getNumber(medicine.purchasePrice);
    const sellingPrice = this.getNumber(medicine.sellingPrice);

    let status: StockReportItem['status'];

    if (quantity <= 0) {
      status = 'Out of Stock';
    } else if (quantity <= reorderLevel) {
      status = 'Low Stock';
    } else {
      status = 'In Stock';
    }

    return {
      id: String(medicine.id),
      name: medicine.name || 'Unknown Medicine',
      genericName: medicine.genericName || '-',
      category: medicine.category || 'Other',
      company: medicine.brandName || '-',
      sku: medicine.sku || '-',
      quantity,
      reorderLevel,
      purchasePrice,
      sellingPrice,
      stockValue: quantity * purchasePrice,
      status
    };
  }

  calculateSummary(): void {
    this.totalProducts = this.stockItems.length;

    this.totalQuantity = this.stockItems.reduce(
      (total, item) => total + item.quantity,
      0
    );

    this.totalStockValue = this.stockItems.reduce(
      (total, item) => total + item.stockValue,
      0
    );

    this.lowStockCount = this.stockItems.filter(
      item => item.status === 'Low Stock'
    ).length;

    this.outOfStockCount = this.stockItems.filter(
      item => item.status === 'Out of Stock'
    ).length;

    this.inStockCount = this.stockItems.filter(
      item => item.status === 'In Stock'
    ).length;
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredItems = this.stockItems.filter(item => {
      const matchesSearch =
        !search ||
        item.name.toLowerCase().includes(search) ||
        item.genericName.toLowerCase().includes(search) ||
        item.company.toLowerCase().includes(search) ||
        item.sku.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        item.status === this.selectedStatus;

      const matchesCategory =
        this.selectedCategory === 'All' ||
        item.category === this.selectedCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }

  onSearch(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'All';
    this.selectedCategory = 'All';
    this.applyFilters();
  }

  get categories(): string[] {
    const categories = this.stockItems
      .map(item => item.category)
      .filter(Boolean);

    return ['All', ...Array.from(new Set(categories))];
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

  getPotentialSalesValue(): number {
    return this.stockItems.reduce(
      (total, item) => total + item.quantity * item.sellingPrice,
      0
    );
  }

  getExpectedProfit(): number {
    return this.getPotentialSalesValue() - this.totalStockValue;
  }

  private getNumber(value: unknown): number {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  refresh(): void {
    this.loadStockReport();
  }

  exportReport(): void {
    if (!this.filteredItems.length) {
      return;
    }

    const headers = [
      'Medicine',
      'Generic Name',
      'Category',
      'Company',
      'SKU',
      'Quantity',
      'Reorder Level',
      'Purchase Price',
      'Selling Price',
      'Stock Value',
      'Status'
    ];

    const rows = this.filteredItems.map(item => [
      item.name,
      item.genericName,
      item.category,
      item.company,
      item.sku,
      item.quantity,
      item.reorderLevel,
      item.purchasePrice,
      item.sellingPrice,
      item.stockValue,
      item.status
    ]);

    const csv = [headers, ...rows]
      .map(row =>
        row
          .map(value => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `stock-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }
}
