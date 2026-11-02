import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  timezone: string;
  currency: string;
  trialPeriod: number;
  invoicePrefix: string;
  taxPercentage: number;
  autoRenewal: boolean;
  emailNotifications: boolean;
  billingAlerts: boolean;
  newTenantAlerts: boolean;
  supportAlerts: boolean;
  sessionTimeout: number;
  twoFactorAuth: boolean;
  loginAttemptLimit: number;
  passwordExpiry: number;
  maintenanceMode: boolean;
}

@Component({
  selector: 'app-platform-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './platform-settings.component.html',
  styleUrl: './platform-settings.component.scss'
})
export class PlatformSettingsComponent implements OnInit {
  activeSection = 'general';
  loading = false;
  saving = false;
  resetting = false;
  errorMessage = '';
  successMessage = '';

  settings: PlatformSettings = this.defaultSettings();

  sections = [
    { id: 'general', title: 'General', icon: 'bi bi-gear' },
    { id: 'billing', title: 'SaaS & Billing', icon: 'bi bi-credit-card' },
    { id: 'notifications', title: 'Notifications', icon: 'bi bi-bell' },
    { id: 'security', title: 'Security', icon: 'bi bi-shield-lock' },
    { id: 'platform', title: 'Platform', icon: 'bi bi-sliders' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  private defaultSettings(): PlatformSettings {
    return {
      platformName: 'PharmSaaS',
      supportEmail: 'support@pharmsaas.com',
      supportPhone: '+880 1700-000000',
      timezone: 'Asia/Dhaka',
      currency: 'BDT',
      trialPeriod: 14,
      invoicePrefix: 'INV-',
      taxPercentage: 5,
      autoRenewal: true,
      emailNotifications: true,
      billingAlerts: true,
      newTenantAlerts: true,
      supportAlerts: true,
      sessionTimeout: 30,
      twoFactorAuth: false,
      loginAttemptLimit: 5,
      passwordExpiry: 90,
      maintenanceMode: false
    };
  }

  loadSettings(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<PlatformSettings>('/super-admin/platform-settings')
      .subscribe({
        next: result => {
          this.settings = { ...this.defaultSettings(), ...result };
          this.loading = false;
        },
        error: error => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message || 'Failed to load platform settings. Please retry.';
        }
      });
  }

  selectSection(section: string): void {
    this.activeSection = section;
  }

  saveSettings(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.put<PlatformSettings>(
      '/super-admin/platform-settings',
      this.settings
    ).subscribe({
      next: result => {
        this.settings = { ...result };
        this.saving = false;
        this.successMessage = 'Platform settings saved successfully.';
      },
      error: error => {
        this.saving = false;
        this.errorMessage =
          error?.error?.message || 'Could not save settings. Please try again.';
      }
    });
  }

  resetSettings(): void {
    if (!confirm('Are you sure you want to reset all platform settings to defaults?')) {
      return;
    }

    this.resetting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.post<PlatformSettings>(
      '/super-admin/platform-settings/reset',
      {}
    ).subscribe({
      next: result => {
        this.settings = { ...result };
        this.resetting = false;
        this.successMessage = 'Platform settings restored to defaults.';
      },
      error: error => {
        this.resetting = false;
        this.errorMessage =
          error?.error?.message || 'Could not reset settings. Please try again.';
      }
    });
  }

  toggleMaintenance(): void {
    if (this.settings.maintenanceMode) {
      const confirmed = confirm(
        'Enable maintenance mode? This setting will be saved only after you click Save Changes.'
      );

      if (!confirmed) {
        this.settings.maintenanceMode = false;
      }
    }
  }
}
