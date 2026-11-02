import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface OrganizationSettings {
  tenantId: number;
  tenantCode: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
}

@Component({
  selector: 'app-orgnization-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orgnization-settings.component.html',
  styleUrl: './orgnization-settings.component.scss'
})
export class OrgnizationSettingsComponent implements OnInit {
  settings: OrganizationSettings = {
    tenantId: 0,
    tenantCode: '',
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    address: ''
  };

  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  private resolveTenantId(): number {
    const userTenantId = this.auth.getCurrentUser()?.tenantId;
    const storedTenantId = localStorage.getItem('tenantId');
    return Number(userTenantId || storedTenantId || 0);
  }

  loadSettings(): void {
    const tenantId = this.resolveTenantId();

    if (!tenantId || tenantId <= 0) {
      this.errorMessage = 'Tenant information পাওয়া যায়নি। আবার লগইন করুন।';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.get<OrganizationSettings>(
      `/tenant-settings/${tenantId}/organization`
    ).subscribe({
      next: response => {
        this.settings = { ...response };
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message ||
          'Organization information load করা যায়নি।';
      }
    });
  }

  saveSettings(): void {
    const tenantId = this.resolveTenantId();

    if (!tenantId || tenantId <= 0) {
      this.errorMessage = 'Valid Tenant ID পাওয়া যায়নি।';
      return;
    }

    if (!this.settings.name?.trim()) {
      this.errorMessage = 'Organization Name দেওয়া বাধ্যতামূলক।';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      name: this.settings.name.trim(),
      ownerName: this.settings.ownerName?.trim() || null,
      email: this.settings.email?.trim() || null,
      phone: this.settings.phone?.trim() || null,
      address: this.settings.address?.trim() || null
    };

    this.api.put<OrganizationSettings>(
      `/tenant-settings/${tenantId}/organization`,
      payload
    ).subscribe({
      next: response => {
        this.settings = { ...response };
        this.saving = false;
        this.successMessage = 'Organization Settings সফলভাবে সংরক্ষণ হয়েছে।';
      },
      error: error => {
        this.saving = false;
        this.errorMessage =
          error?.error?.message ||
          'Settings সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।';
      }
    });
  }

  resetForm(): void {
    this.loadSettings();
  }
}
