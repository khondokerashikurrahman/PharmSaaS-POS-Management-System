import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CompanyApiService } from '../../../core/services/company-api.service';
import { TenantInventoryApiService, TenantInventoryItem } from '../../../core/services/tenant-inventory-api.service';

interface CompanyModel {
  apiId: number;
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  medicines: number;
  totalPurchases: number;
  dueAmount: number;
  status: 'Active' | 'Inactive';
}

interface CompanyProduct {
  id: number;
  name: string;
  generic: string;
  category: string;
  stock: number;
  purchasePrice: number;
  salePrice: number;
  status: string;
}

@Component({
  selector: 'app-company-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-details.component.html',
  styleUrl: './company-details.component.scss'
})
export class CompanyDetailsComponent implements OnInit {
  companyId = '';
  loading = false;
  productsLoading = false;
  errorMessage = '';
  productsError = '';

  company: CompanyModel = {
    apiId: 0, id: '', name: '', contactPerson: '', phone: '',
    email: '', address: '', medicines: 0, totalPurchases: 0,
    dueAmount: 0, status: 'Active'
  };

  medicines: CompanyProduct[] = [];
  purchases: Array<{
    invoice: string; date: string; amount: number;
    paid: number; due: number; status: string;
  }> = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private companyApi: CompanyApiService,
    private inventoryApi: TenantInventoryApiService
  ) {}

  ngOnInit(): void {
    this.companyId = this.route.snapshot.paramMap.get('id') || '';
    this.loadCompany();
  }

  private tenantId(): number {
    return Number(localStorage.getItem('tenantId') || 0);
  }

  private linkedToCompany(product: TenantInventoryItem): boolean {
    if (product.companyId != null) {
      return product.companyId === this.company.apiId;
    }
    return !!product.brandName &&
      product.brandName.trim().toLowerCase() ===
        this.company.name.trim().toLowerCase();
  }

  loadCompany(): void {
    const tenantId = this.tenantId();
    const id = Number(this.companyId);

    if (!tenantId || !Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Invalid company ID. Company list থেকে record খোলো।';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.companyApi.get(tenantId, id).subscribe({
      next: c => {
        this.company = {
          apiId: c.id,
          id: c.companyCode,
          name: c.name || '',
          contactPerson: c.contactPerson || '',
          phone: c.phone || '',
          email: c.email || '',
          address: c.address || '',
          medicines: 0,
          totalPurchases: 0,
          dueAmount: 0,
          status: c.status === 'Inactive' ? 'Inactive' : 'Active'
        };
        this.loading = false;
        this.loadCompanyProducts(tenantId);
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message ||
          'Company details load করা যায়নি।';
      }
    });
  }

  private loadCompanyProducts(tenantId: number): void {
    this.productsLoading = true;
    this.productsError = '';

    this.inventoryApi.list(tenantId).subscribe({
      next: rows => {
        this.medicines = (rows || [])
          .filter(product => this.linkedToCompany(product))
          .map(product => this.toCompanyProduct(product));
        this.company.medicines = this.medicines.length;
        this.productsLoading = false;
      },
      error: err => {
        this.productsLoading = false;
        this.productsError = err?.error?.message ||
          'Company products load করা যায়নি।';
      }
    });
  }

  private toCompanyProduct(product: TenantInventoryItem): CompanyProduct {
    const stock = Number(product.stockQuantity || 0);
    const reorder = Number(product.reorderLevel || 0);
    let status = 'In Stock';
    if (stock <= 0) status = 'Out of Stock';
    else if (stock <= reorder) status = 'Low Stock';

    return {
      id: product.id,
      name: product.name || '',
      generic: product.genericName || '—',
      category: product.category || product.dosageForm || '—',
      stock,
      purchasePrice: Number(product.purchasePrice || 0),
      salePrice: Number(product.sellingPrice || 0),
      status
    };
  }

  get totalStock(): number {
    return this.medicines.reduce((sum, m) => sum + m.stock, 0);
  }

  get lowStockCount(): number {
    return this.medicines.filter(m => m.status === 'Low Stock').length;
  }

  goBack(): void {
    this.router.navigate(['/app/inventory/companies']);
  }

  editCompany(): void {
    this.router.navigate([
      '/app/inventory/companies', this.company.apiId, 'edit'
    ]);
  }

  viewMedicine(product: CompanyProduct): void {
    this.router.navigate(['/app/inventory/medicines', product.id]);
  }
}
