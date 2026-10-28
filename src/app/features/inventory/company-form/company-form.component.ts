import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CompanyApiService } from '../../../core/services/company-api.service';

interface CompanyModel {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: 'Active' | 'Inactive';
}

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-form.component.html',
  styleUrl: './company-form.component.scss'
})
export class CompanyFormComponent implements OnInit {
  isEditMode = false;
  companyId = '';
  loading = false;
  saving = false;
  errorMessage = '';

  company: CompanyModel = {
    id: 'Generated on save',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    status: 'Active'
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: CompanyApiService
  ) {}

  ngOnInit(): void {
    this.companyId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditMode = !!this.companyId;
    if (this.isEditMode) this.loadCompany();
  }

  private tenantId(): number {
    return Number(localStorage.getItem('tenantId') || 0);
  }

  generateCompanyId(): string { return 'Generated on save'; }

  loadCompany(): void {
    const tenantId = this.tenantId();
    const id = Number(this.companyId);

    if (!tenantId || !Number.isInteger(id) || id <= 0) {
      this.errorMessage = 'Invalid company ID. Company list থেকে record খোলো।';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.api.get(tenantId, id).subscribe({
      next: c => {
        this.company = {
          id: c.companyCode,
          name: c.name || '',
          contactPerson: c.contactPerson || '',
          phone: c.phone || '',
          email: c.email || '',
          address: c.address || '',
          status: c.status === 'Inactive' ? 'Inactive' : 'Active'
        };
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMessage = err?.error?.message ||
          'Company তথ্য load করা যায়নি।';
      }
    });
  }

  saveCompany(): void {
    this.errorMessage = '';

    if (!this.company.name.trim()) {
      this.errorMessage = 'Company name লিখো।';
      return;
    }
    if (!this.company.contactPerson.trim()) {
      this.errorMessage = 'Contact person লিখো।';
      return;
    }
    if (!this.company.phone.trim()) {
      this.errorMessage = 'Phone number লিখো।';
      return;
    }
    if (!this.company.email.trim()) {
      this.errorMessage = 'Email address লিখো।';
      return;
    }
    if (!this.company.address.trim()) {
      this.errorMessage = 'Company address লিখো।';
      return;
    }

    const tenantId = this.tenantId();
    if (!tenantId) {
      this.errorMessage = 'Tenant পাওয়া যায়নি। আবার login করো।';
      return;
    }

    const request = {
      name: this.company.name.trim(),
      contactPerson: this.company.contactPerson.trim(),
      phone: this.company.phone.trim(),
      email: this.company.email.trim(),
      address: this.company.address.trim(),
      status: this.company.status
    };

    this.saving = true;
    const operation = this.isEditMode
      ? this.api.update(tenantId, Number(this.companyId), request)
      : this.api.create(tenantId, request);

    operation.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/app/inventory/companies']);
      },
      error: err => {
        this.saving = false;
        this.errorMessage = err?.error?.message ||
          (err?.status === 409
            ? 'এই company name আগে থেকেই আছে।'
            : 'Company save করা যায়নি। Backend ও permission পরীক্ষা করো।');
      }
    });
  }

  cancel(): void { this.goBack(); }

  goBack(): void {
    this.router.navigate(['/app/inventory/companies']);
  }
}
