import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface PaymentSettings {
  tenantId?: number;
  cashEnabled: boolean;
  cardEnabled: boolean;
  mobileEnabled: boolean;
  discountEnabled: boolean;
  maximumDiscountPercentage: number;
  customerRequired: boolean;
}

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-methods.component.html',
  styleUrl: './payment-methods.component.scss'
})
export class PaymentMethodsComponent implements OnInit {
  settings: PaymentSettings = this.defaults();
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

  private defaults(): PaymentSettings {
    return {
      cashEnabled: true,
      cardEnabled: true,
      mobileEnabled: true,
      discountEnabled: true,
      maximumDiscountPercentage: 10,
      customerRequired: false
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

    this.api.get<PaymentSettings>(`/tenant-settings/${tenantId}/pos`)
      .subscribe({
        next: response => {
          this.settings = { ...this.defaults(), ...response };
          this.loading = false;
        },
        error: error => {
          this.loading = false;
          this.errorMessage = error?.error?.detail ||
            error?.error?.message || 'Payment settings load করা যায়নি।';
        }
      });
  }

  saveSettings(): void {
    const tenantId = this.getTenantId();
    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি।';
      return;
    }

    if (!this.settings.cashEnabled &&
        !this.settings.cardEnabled &&
        !this.settings.mobileEnabled) {
      this.errorMessage = 'অন্তত একটি Payment Method চালু রাখতে হবে।';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.put<PaymentSettings>(
      `/tenant-settings/${tenantId}/pos`,
      this.settings
    ).subscribe({
      next: response => {
        this.settings = { ...this.defaults(), ...response };
        this.saving = false;
        this.successMessage = 'Payment Methods সফলভাবে সংরক্ষণ হয়েছে।';
      },
      error: error => {
        this.saving = false;
        this.errorMessage = error?.error?.detail ||
          error?.error?.message || 'Payment Methods সংরক্ষণ করা যায়নি।';
      }
    });
  }

  get enabledCount(): number {
    return [
      this.settings.cashEnabled,
      this.settings.cardEnabled,
      this.settings.mobileEnabled
    ].filter(Boolean).length;
  }
}
