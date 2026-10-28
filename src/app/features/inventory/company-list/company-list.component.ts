import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CompanyApiService } from '../../../core/services/company-api.service';
import { TenantInventoryApiService, TenantInventoryItem } from '../../../core/services/tenant-inventory-api.service';

interface Company {
  apiId: number;
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  medicines: number;
  totalPurchases: number;
  dueAmount: number;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.scss'
})
export class CompanyListComponent implements OnInit {
  searchTerm = '';
  selectedStatus = 'All';
  companies: Company[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private router: Router,
    private companyApi: CompanyApiService,
    private inventoryApi: TenantInventoryApiService
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  private tenantId(): number {
    return Number(localStorage.getItem('tenantId') || 0);
  }

  private isLinkedProduct(product: TenantInventoryItem, company: Company): boolean {
    if (product.companyId != null) {
      return product.companyId === company.apiId;
    }
    return !!product.brandName &&
      product.brandName.trim().toLowerCase() === company.name.trim().toLowerCase();
  }

  loadCompanies(): void {
    const tenantId = this.tenantId();
    if (!tenantId) {
      this.errorMessage = 'Tenant পাওয়া যায়নি। আবার login করো।';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.companyApi.list(tenantId).subscribe({
      next: rows => {
        this.companies = (rows || []).map(c => ({
          apiId: c.id,
          id: c.companyCode,
          name: c.name || '',
          contactPerson: c.contactPerson || '',
          phone: c.phone || '',
          email: c.email || '',
          medicines: 0,
          totalPurchases: 0,
          dueAmount: 0,
          status: c.status === 'Inactive' ? 'Inactive' : 'Active'
        }));

        this.inventoryApi.list(tenantId).subscribe({
          next: products => {
            this.companies = this.companies.map(company => ({
              ...company,
              medicines: (products || []).filter(
                product => this.isLinkedProduct(product, company)
              ).length
            }));
            this.loading = false;
          },
          error: err => {
            this.loading = false;
            this.errorMessage =
              'Company list এসেছে, কিন্তু product counts load হয়নি: ' +
              (err?.error?.message || 'Inventory API error');
          }
        });
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message ||
          'Company list load করা যায়নি। Backend ও login পরীক্ষা করো।';
      }
    });
  }

  get filteredCompanies(): Company[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.companies.filter(c => {
      const matchesText = !q ||
        c.id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q);

      return matchesText &&
        (this.selectedStatus === 'All' || c.status === this.selectedStatus);
    });
  }

  get totalCompanies(): number { return this.companies.length; }
  get activeCompanies(): number {
    return this.companies.filter(c => c.status === 'Active').length;
  }
  get inactiveCompanies(): number {
    return this.companies.filter(c => c.status === 'Inactive').length;
  }

  // Purchase and due calculations are not yet linked to Company records.
  get totalDue(): number { return 0; }
  get totalPurchases(): number { return 0; }

  viewCompany(c: Company): void {
    this.router.navigate(['/app/inventory/companies', c.apiId]);
  }

  editCompany(c: Company): void {
    this.router.navigate(['/app/inventory/companies', c.apiId, 'edit']);
  }

  addCompany(): void {
    this.router.navigate(['/app/inventory/companies/new']);
  }

  clearSearch(): void { this.searchTerm = ''; }
  trackByCompanyId(index: number, c: Company): number { return c.apiId; }
}
