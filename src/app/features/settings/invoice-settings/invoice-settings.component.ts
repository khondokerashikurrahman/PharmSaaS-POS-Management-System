import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface InvoiceSettings {
  tenantId?: number;
  invoiceTitle: string;
  logoUrl: string;
  headerText: string;
  footerText: string;
  invoiceNumberPrefix: string;
  paperSize: 'A4' | '80MM' | '58MM';
  showCustomerInfo: boolean;
  showTax: boolean;
  showDiscount: boolean;
  showBatchNumber: boolean;
  showExpiryDate: boolean;
  showPaymentMethod: boolean;
  autoPrint: boolean;
}

@Component({
  selector: 'app-invoice-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-settings.component.html',
  styleUrl: './invoice-settings.component.scss'
})
export class InvoiceSettingsComponent implements OnInit {
  settings: InvoiceSettings = this.defaultSettings();

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

  private defaultSettings(): InvoiceSettings {
    return {
      invoiceTitle: 'Sales Invoice',
      logoUrl: '',
      headerText: '',
      footerText: '',
      invoiceNumberPrefix: 'INV',
      paperSize: 'A4',
      showCustomerInfo: true,
      showTax: true,
      showDiscount: true,
      showBatchNumber: true,
      showExpiryDate: true,
      showPaymentMethod: true,
      autoPrint: false
    };
  }

  private getTenantId(): number | null {
    const userTenantId = this.auth.getCurrentUser()?.tenantId;
    const storedTenantId = localStorage.getItem('tenantId');
    const id = Number(userTenantId || storedTenantId);

    return Number.isSafeInteger(id) && id > 0 ? id : null;
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

    this.api.get<InvoiceSettings>(
      `/tenant-settings/${tenantId}/invoice`
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
          'Invoice Settings load করা যায়নি।';
      }
    });
  }

  saveSettings(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি।';
      return;
    }

    if (!this.settings.invoiceTitle.trim()) {
      this.errorMessage = 'Invoice Title দিতে হবে।';
      return;
    }

    const prefix = this.settings.invoiceNumberPrefix.trim();

    if (!/^[A-Za-z0-9-]{1,12}$/.test(prefix)) {
      this.errorMessage =
        'Invoice Prefix ১-১২ অক্ষরের হতে হবে। শুধু Letter, Number ও Hyphen ব্যবহার করুন।';
      return;
    }

    if (
      this.settings.logoUrl.trim() &&
      !/^https?:\/\//i.test(this.settings.logoUrl.trim())
    ) {
      this.errorMessage = 'Logo URL অবশ্যই http:// অথবা https:// দিয়ে শুরু হতে হবে।';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: InvoiceSettings = {
      ...this.settings,
      invoiceTitle: this.settings.invoiceTitle.trim(),
      invoiceNumberPrefix: prefix.toUpperCase(),
      logoUrl: this.settings.logoUrl.trim(),
      headerText: this.settings.headerText.trim(),
      footerText: this.settings.footerText.trim()
    };

    this.api.put<InvoiceSettings>(
      `/tenant-settings/${tenantId}/invoice`,
      payload
    ).subscribe({
      next: response => {
        this.settings = {
          ...this.defaultSettings(),
          ...response
        };
        this.saving = false;
        this.successMessage = 'Invoice Settings সফলভাবে সংরক্ষণ হয়েছে।';
      },
      error: error => {
        this.saving = false;
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Invoice Settings সংরক্ষণ করা যায়নি।';
      }
    });
  }

  resetSettings(): void {
    this.loadSettings();
  }
}
