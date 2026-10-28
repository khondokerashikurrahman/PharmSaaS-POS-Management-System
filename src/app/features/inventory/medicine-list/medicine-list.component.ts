import { Component, OnInit, inject } from '@angular/core';
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
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  description?: string;
  sku?: string;
  purchasePrice?: number;
  barcode?: string;
}

@Component({
  selector: 'app-medicine-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medicine-list.component.html',
  styleUrl: './medicine-list.component.scss'
})
export class MedicineListComponent implements OnInit {
  private inventoryApi = inject(TenantInventoryApiService);

  constructor(private router: Router) {}

  searchTerm = '';
  selectedCategory = 'All';
  loading = false;
  medicines: Medicine[] = [];

  ngOnInit(): void {
    this.loadMedicines();
  }

  loadMedicines(): void {
    const tenantId = Number(localStorage.getItem('tenantId'));

    if (!Number.isInteger(tenantId) || tenantId <= 0) {
      this.medicines = [];
      alert('Tenant ID not found. Please log in again.');
      return;
    }

    this.loading = true;

    this.inventoryApi.list(tenantId).subscribe({
      next: items => {
        this.medicines = items.map(item => {
          const stock = Number(item.stockQuantity ?? 0);
          const reorderLevel = Number(item.reorderLevel ?? 0);

          return {
            id: item.id,
            name: item.name,
            generic: item.genericName || '',
            company: item.brandName || '',
            category: item.category || 'Other',
            description: item.description || '',
            strength: item.strength || '',
            dosageForm: item.dosageForm || '',
            unitPrice: Number(item.sellingPrice ?? 0),
            stock,
            reorderLevel,
            status: this.getMedicineStatus(stock, reorderLevel),
            sku: item.sku,
            purchasePrice: Number(item.purchasePrice ?? 0),
            barcode: item.barcode || ''
          };
        });
        this.loading = false;
      },
      error: err => {
        console.error('Failed to load tenant inventory', err);
        this.medicines = [];
        this.loading = false;
        alert(err?.error?.message || 'Could not load medicines from the backend.');
      }
    });
  }

  getMedicineStatus(
    stock: number,
    reorderLevel: number
  ): Medicine['status'] {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= reorderLevel) return 'Low Stock';
    return 'In Stock';
  }

  get categories(): string[] {
    return [
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
  }

  get filteredMedicines(): Medicine[] {
    const term = this.searchTerm.toLowerCase().trim();

    return this.medicines.filter(medicine => {
      const matchesSearch =
        !term ||
        medicine.name.toLowerCase().includes(term) ||
        medicine.generic.toLowerCase().includes(term) ||
        medicine.company.toLowerCase().includes(term) ||
        (medicine.sku || '').toLowerCase().includes(term) ||
        (medicine.barcode || '').toLowerCase().includes(term);

      const matchesCategory =
        this.selectedCategory === 'All' ||
        medicine.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }

  get totalMedicines(): number {
    return this.medicines.length;
  }

  get totalStock(): number {
    return this.medicines.reduce((total, medicine) => total + medicine.stock, 0);
  }

  get lowStockCount(): number {
    return this.medicines.filter(medicine => medicine.status === 'Low Stock').length;
  }

  get outOfStockCount(): number {
    return this.medicines.filter(medicine => medicine.status === 'Out of Stock').length;
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  addMedicine(): void {
    this.router.navigate(['/app/inventory/medicines/new']);
  }

  viewMedicine(medicine: Medicine): void {
    this.router.navigate(['/app/inventory/medicines', medicine.id]);
  }

  editMedicine(medicine: Medicine): void {
    this.router.navigate(['/app/inventory/medicines', medicine.id, 'edit']);
  }

  getStatusClass(status: Medicine['status']): string {
    switch (status) {
      case 'In Stock':
        return 'in-stock';
      case 'Low Stock':
        return 'low-stock';
      case 'Out of Stock':
        return 'out-of-stock';
      default:
        return '';
    }
  }
}
