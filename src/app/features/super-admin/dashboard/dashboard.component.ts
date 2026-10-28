import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {

  stats = [
    {
      title: 'Total Tenants',
      value: '248',
      icon: '🏪',
      change: '+12.5%',
      label: 'from last month'
    },
    {
      title: 'Active Subscriptions',
      value: '192',
      icon: '💳',
      change: '+8.2%',
      label: 'from last month'
    },
    {
      title: 'Monthly Revenue',
      value: '$24,580',
      icon: '💰',
      change: '+14.8%',
      label: 'from last month'
    },
    {
      title: 'Expiring Soon',
      value: '17',
      icon: '⚠️',
      change: 'Next 30 days',
      label: ''
    }
  ];

  recentTenants = [
    {
      pharmacy: 'Care Pharmacy',
      owner: 'Rahim Ahmed',
      plan: 'Premium',
      status: 'Active',
      date: '10 Sep 2026'
    },
    {
      pharmacy: 'MediPlus Pharmacy',
      owner: 'Karim Hasan',
      plan: 'Standard',
      status: 'Active',
      date: '09 Sep 2026'
    },
    {
      pharmacy: 'HealthCare Drug House',
      owner: 'Sakib Khan',
      plan: 'Basic',
      status: 'Pending',
      date: '08 Sep 2026'
    },
    {
      pharmacy: 'Popular Medicine Center',
      owner: 'Nayeem Islam',
      plan: 'Premium',
      status: 'Active',
      date: '07 Sep 2026'
    }
  ];

  recentPayments = [
    {
      pharmacy: 'Care Pharmacy',
      amount: '$199',
      plan: 'Premium',
      date: '10 Sep 2026'
    },
    {
      pharmacy: 'MediPlus Pharmacy',
      amount: '$99',
      plan: 'Standard',
      date: '09 Sep 2026'
    },
    {
      pharmacy: 'Popular Medicine Center',
      amount: '$199',
      plan: 'Premium',
      date: '07 Sep 2026'
    }
  ];

  refreshDashboard(): void {
  console.log('Dashboard refreshed');
}

}