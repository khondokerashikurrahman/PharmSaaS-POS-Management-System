import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface TaxSettings {
  tenantId?: number;
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;
}

@Component({
  selector: 'app-tax-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tax-settings.component.html',
  styleUrl: './tax-settings.component.scss'
})
export class TaxSettingsComponent implements OnInit {
  settings: TaxSettings = this.defaultSettings();
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  private defaultSettings(): TaxSettings {
    return {
      taxEnabled: false,
      taxName: 'VAT',
      taxRate: 0
    };
  }

  private getTenantId(): number | null {
    const userTenantId = this.auth.getCurrentUser()?.tenantId;
    const storedTenantId = localStorage.getItem('tenantId');
    const id = Number(userTenantId || storedTenantId);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  loadSettings(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করুন।';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.get<TaxSettings>(
      `/tenant-settings/${tenantId}/tax`
    ).subscribe({
      next: response => {
        this.settings = {
          ...this.defaultSettings(),
          ...response,
          taxRate: Number(response.taxRate ?? 0)
        };
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Tax Settings load করা যায়নি।';
      }
    });
  }

  saveSettings(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি।';
      return;
    }

    this.settings.taxName = this.settings.taxName.trim();

    if (!this.settings.taxName) {
      this.errorMessage = 'Tax name দিতে হবে।';
      return;
    }

    if (
      !Number.isFinite(this.settings.taxRate) ||
      this.settings.taxRate < 0 ||
      this.settings.taxRate > 100
    ) {
      this.errorMessage = 'Tax rate ০ থেকে ১০০ এর মধ্যে হতে হবে।';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: TaxSettings = {
      taxEnabled: this.settings.taxEnabled,
      taxName: this.settings.taxName,
      taxRate: Number(this.settings.taxRate)
    };

    this.api.put<TaxSettings>(
      `/tenant-settings/${tenantId}/tax`,
      payload
    ).subscribe({
      next: response => {
        this.settings = {
          ...this.defaultSettings(),
          ...response,
          taxRate: Number(response.taxRate ?? 0)
        };
        this.saving = false;
        this.successMessage = 'Tax Settings সফলভাবে সংরক্ষণ হয়েছে।';
      },
      error: error => {
        this.saving = false;
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Tax Settings সংরক্ষণ করা যায়নি।';
      }
    });
  }

  resetSettings(): void {
    this.loadSettings();
  }
}
