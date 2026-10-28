import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-platform-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './platform-settings.component.html',
  styleUrl: './platform-settings.component.scss'
})
export class PlatformSettingsComponent {

  activeSection = 'general';

  settings = {
    // General
    platformName: 'PharmSaaS',
    supportEmail: 'support@pharmsaas.com',
    supportPhone: '+880 1700-000000',
    timezone: 'Asia/Dhaka',
    currency: 'BDT',

    // Billing
    trialPeriod: 14,
    invoicePrefix: 'INV-',
    taxPercentage: 5,
    autoRenewal: true,

    // Notifications
    emailNotifications: true,
    billingAlerts: true,
    newTenantAlerts: true,
    supportAlerts: true,

    // Security
    sessionTimeout: 30,
    twoFactorAuth: false,
    loginAttemptLimit: 5,
    passwordExpiry: 90,

    // Platform
    maintenanceMode: false
  };

  sections = [
    {
      id: 'general',
      title: 'General',
      icon: 'bi bi-gear'
    },
    {
      id: 'billing',
      title: 'SaaS & Billing',
      icon: 'bi bi-credit-card'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'bi bi-bell'
    },
    {
      id: 'security',
      title: 'Security',
      icon: 'bi bi-shield-lock'
    },
    {
      id: 'platform',
      title: 'Platform',
      icon: 'bi bi-sliders'
    }
  ];

  selectSection(section: string): void {
    this.activeSection = section;
  }

  saveSettings(): void {
    alert('Platform settings saved successfully.');
  }

  resetSettings(): void {
    const confirmed = confirm(
      'Are you sure you want to reset all settings?'
    );

    if (!confirmed) {
      return;
    }

    this.settings = {
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

    alert('Settings have been reset.');
  }

  toggleMaintenance(): void {
    if (this.settings.maintenanceMode) {
      const confirmed = confirm(
        'Enable maintenance mode? Users may not be able to access the platform.'
      );

      if (!confirmed) {
        this.settings.maintenanceMode = false;
      }
    }
  }
}