
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TenantInventoryApiService } from '../../../core/services/tenant-inventory-api.service';

interface Medicine {
  id: number;
  name: string;
  generic: string;
  company: string;
  category: string;
  strength: string;
  dosageForm?: string;
  unitPrice: number;
  stock: number;
  reorderLevel: number;
  status?: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

@Component({
  selector: 'app-low-stock',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './low-stock.component.html',
  styleUrl: './low-stock.component.scss'
})
export class LowStockComponent implements OnInit {

  medicines: Medicine[] = [];

  searchTerm = '';
  selectedCategory = 'All';

  categories = [
    'All',
    'Pain Relief',
    'Gastric',
    'Diabetes',
    'Allergy',
    'Antibiotic',
    'Vitamin & Supplement',
    'Cardiovascular',
    'Other'
  ];

  loading = false;
  errorMessage = '';

  constructor(
    private inventoryApi: TenantInventoryApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMedicines();
  }

  loadMedicines(): void {
    const tenantId = Number(localStorage.getItem('tenantId'));

    if (!Number.isSafeInteger(tenantId) || tenantId <= 0) {
      this.medicines = [];
      this.errorMessage = 'Tenant ID not found. Please log in again.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.inventoryApi.list(tenantId).subscribe({
      next: items => {
        this.medicines = (Array.isArray(items) ? items : []).map(item => {
          const stock = Number(item.stockQuantity ?? 0);
          const reorderLevel = Number(item.reorderLevel ?? 0);

          return {
            id: item.id,
            name: item.name || '',
            generic: item.genericName || '',
            company: item.brandName || '',
            category: item.category || 'Other',
            strength: item.strength || '',
            dosageForm: item.dosageForm || '',
            unitPrice: Number(item.sellingPrice ?? 0),
            stock,
            reorderLevel,
            status: this.getMedicineStatus(stock, reorderLevel)
          };
        });

        this.loading = false;
      },
      error: err => {
        console.error('Failed to load low-stock inventory:', err);
        this.medicines = [];
        this.loading = false;
        this.errorMessage =
          err?.error?.message || 'Could not load inventory from the backend.';
      }
    });
  }

  getMedicineStatus(
    stock: number,
    reorderLevel: number
  ): Medicine['status'] {

    if (stock <= 0) {
      return 'Out of Stock';
    }

    if (stock <= reorderLevel) {
      return 'Low Stock';
    }

    return 'In Stock';
  }

  get lowStockMedicines(): Medicine[] {

    return this.medicines.filter(
      medicine =>
        medicine.stock > 0 &&
        medicine.stock <= medicine.reorderLevel
    );
  }

  get outOfStockMedicines(): Medicine[] {

    return this.medicines.filter(
      medicine =>
        medicine.stock <= 0
    );
  }

  get filteredMedicines(): Medicine[] {

    const term =
      this.searchTerm.toLowerCase().trim();

    return this.medicines.filter(
      medicine => {

        const isLowOrOut =
          medicine.stock <=
          medicine.reorderLevel;

        if (!isLowOrOut) {
          return false;
        }

        const matchesSearch =
          !term ||
          medicine.name
            .toLowerCase()
            .includes(term) ||
          medicine.generic
            .toLowerCase()
            .includes(term) ||
          medicine.company
            .toLowerCase()
            .includes(term);

        const matchesCategory =
          this.selectedCategory === 'All' ||
          medicine.category ===
          this.selectedCategory;

        return matchesSearch &&
               matchesCategory;
      }
    );
  }

  get totalLowStock(): number {
    return this.lowStockMedicines.length;
  }

  get totalOutOfStock(): number {
    return this.outOfStockMedicines.length;
  }

  get totalCriticalItems(): number {
    return this.filteredMedicines.filter(
      medicine =>
        medicine.stock <=
        Math.floor(
          medicine.reorderLevel * 0.5
        )
    ).length;
  }

  get totalRequiredUnits(): number {

    return this.filteredMedicines.reduce(
      (total, medicine) =>
        total +
        Math.max(
          medicine.reorderLevel * 2 -
          medicine.stock,
          0
        ),
      0
    );
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  getStockPercentage(
    medicine: Medicine
  ): number {

    if (medicine.reorderLevel <= 0) {
      return medicine.stock > 0 ? 100 : 0;
    }

    const percentage =
      (medicine.stock /
        (medicine.reorderLevel * 2)) *
      100;

    return Math.min(
      Math.max(percentage, 0),
      100
    );
  }

  getStockClass(
    medicine: Medicine
  ): string {

    if (medicine.stock <= 0) {
      return 'out-of-stock';
    }

    if (
      medicine.stock <=
      Math.floor(
        medicine.reorderLevel * 0.5
      )
    ) {
      return 'critical';
    }

    return 'low';
  }

  getStatusClass(
    medicine: Medicine
  ): string {

    if (medicine.stock <= 0) {
      return 'out-of-stock';
    }

    return 'low-stock';
  }

  getShortageQuantity(
    medicine: Medicine
  ): number {

    return Math.max(
      medicine.reorderLevel -
      medicine.stock,
      0
    );
  }

  viewMedicine(
    medicine: Medicine
  ): void {

    this.router.navigate([
      '/app/inventory/medicines',
      medicine.id
    ]);
  }

  editMedicine(
    medicine: Medicine
  ): void {

    this.router.navigate([
      '/app/inventory/medicines',
      medicine.id,
      'edit'
    ]);
  }

  goToPurchaseOrders(): void {

    this.router.navigate([
      '/app/procurement/purchase-orders'
    ]);
  }

  goBack(): void {

    this.router.navigate([
      '/app/inventory/medicines'
    ]);
  }
}
