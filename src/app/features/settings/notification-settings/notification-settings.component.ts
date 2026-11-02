import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface NotificationSettings {
  tenantId?: number;
  lowStockEnabled: boolean;
  lowStockThreshold: number;
  stockOutEnabled: boolean;
  expiryAlertEnabled: boolean;
  expiryWarningDays: number;
  newSaleEnabled: boolean;
  purchaseReceivedEnabled: boolean;
  customerDueEnabled: boolean;
  emailNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
}

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss'
})
export class NotificationSettingsComponent implements OnInit {
  settings: NotificationSettings = this.defaultSettings();

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

  private defaultSettings(): NotificationSettings {
    return {
      lowStockEnabled: true,
      lowStockThreshold: 10,
      stockOutEnabled: true,
      expiryAlertEnabled: true,
      expiryWarningDays: 30,
      newSaleEnabled: true,
      purchaseReceivedEnabled: true,
      customerDueEnabled: true,
      emailNotificationsEnabled: false,
      inAppNotificationsEnabled: true
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

    this.api.get<NotificationSettings>(
      `/tenant-settings/${tenantId}/notifications`
    ).subscribe({
      next: response => {
        this.settings = {
          ...this.defaultSettings(),
          ...response,
          lowStockThreshold: Number(response.lowStockThreshold ?? 10),
          expiryWarningDays: Number(response.expiryWarningDays ?? 30)
        };
        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Notification Settings load করা যায়নি।';
      }
    });
  }

  saveSettings(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি।';
      return;
    }

    const threshold = Number(this.settings.lowStockThreshold);
    const expiryDays = Number(this.settings.expiryWarningDays);

    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100000) {
      this.errorMessage = 'Low Stock Threshold ১ থেকে ১০০০০০-এর মধ্যে হতে হবে।';
      return;
    }

    if (!Number.isInteger(expiryDays) || expiryDays < 1 || expiryDays > 3650) {
      this.errorMessage = 'Expiry Warning Days ১ থেকে ৩৬৫০-এর মধ্যে হতে হবে।';
      return;
    }

    if (
      !this.settings.emailNotificationsEnabled &&
      !this.settings.inAppNotificationsEnabled
    ) {
      this.errorMessage = 'কমপক্ষে একটি notification channel চালু রাখতে হবে।';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: NotificationSettings = {
      lowStockEnabled: this.settings.lowStockEnabled,
      lowStockThreshold: threshold,
      stockOutEnabled: this.settings.stockOutEnabled,
      expiryAlertEnabled: this.settings.expiryAlertEnabled,
      expiryWarningDays: expiryDays,
      newSaleEnabled: this.settings.newSaleEnabled,
      purchaseReceivedEnabled: this.settings.purchaseReceivedEnabled,
      customerDueEnabled: this.settings.customerDueEnabled,
      emailNotificationsEnabled: this.settings.emailNotificationsEnabled,
      inAppNotificationsEnabled: this.settings.inAppNotificationsEnabled
    };

    this.api.put<NotificationSettings>(
      `/tenant-settings/${tenantId}/notifications`,
      payload
    ).subscribe({
      next: response => {
        this.settings = {
          ...this.defaultSettings(),
          ...response
        };
        this.saving = false;
        this.successMessage = 'Notification Settings সফলভাবে সংরক্ষণ হয়েছে।';
      },
      error: error => {
        this.saving = false;
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Notification Settings সংরক্ষণ করা যায়নি।';
      }
    });
  }

  resetSettings(): void {
    this.loadSettings();
  }
}
