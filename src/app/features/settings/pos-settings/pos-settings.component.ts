import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface PosSettings {
  tenantId?: number;
  discountEnabled: boolean;
  maximumDiscountPercentage: number;
  customerRequired: boolean;
  cashEnabled: boolean;
  cardEnabled: boolean;
  mobileEnabled: boolean;
}

@Component({
  selector: 'app-pos-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pos-settings.component.html',
  styleUrl: './pos-settings.component.scss'
})
export class PosSettingsComponent implements OnInit {
  settings: PosSettings = this.defaultSettings();
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

  private defaultSettings(): PosSettings {
    return {
      discountEnabled: true,
      maximumDiscountPercentage: 10,
      customerRequired: false,
      cashEnabled: true,
      cardEnabled: true,
      mobileEnabled: true
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

    this.api.get<PosSettings>(
      `/tenant-settings/${tenantId}/pos`
    ).subscribe({
      next: response => {
        this.settings = {
          ...this.defaultSettings(),
          ...response
        };
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'POS settings load করা যায়নি।';
      }
    });
  }

  saveSettings(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি।';
      return;
    }

    if (
      !Number.isFinite(this.settings.maximumDiscountPercentage) ||
      this.settings.maximumDiscountPercentage < 0 ||
      this.settings.maximumDiscountPercentage > 100
    ) {
      this.errorMessage = 'Maximum discount ০ থেকে ১০০ এর মধ্যে হতে হবে।';
      return;
    }

    if (
      !this.settings.cashEnabled &&
      !this.settings.cardEnabled &&
      !this.settings.mobileEnabled
    ) {
      this.errorMessage = 'অন্তত একটি payment method চালু রাখতে হবে।';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.put<PosSettings>(
      `/tenant-settings/${tenantId}/pos`,
      this.settings
    ).subscribe({
      next: response => {
        this.settings = {
          ...this.defaultSettings(),
          ...response
        };
        this.saving = false;
        this.successMessage = 'POS Settings সফলভাবে সংরক্ষণ হয়েছে।';
      },
      error: error => {
        this.saving = false;
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'POS Settings সংরক্ষণ করা যায়নি।';
      }
    });
  }

  resetSettings(): void {
    this.loadSettings();
    this.successMessage = '';
  }
}
