import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { TenantService, Tenant } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  currentTenant: Tenant | undefined;

  currentUserName = 'Pharmacy Admin';

  today = '13 September 2026';


  // =====================================================
  // STAT CARDS
  // =====================================================

  stats = [

    {
      title: "Today's Sales",
      value: '৳42,850',
      icon: '💰',
      change: '+12.5%',
      label: 'from yesterday',
      type: 'blue'
    },

    {
      title: "Today's Invoices",
      value: '86',
      icon: '🧾',
      change: '+8.2%',
      label: 'from yesterday',
      type: 'green'
    },

    {
      title: 'Total Medicines',
      value: '1,248',
      icon: '💊',
      change: '+24',
      label: 'new this month',
      type: 'purple'
    },

    {
      title: 'Low Stock Items',
      value: '17',
      icon: '⚠️',
      change: 'Needs attention',
      label: '',
      type: 'orange'
    }

  ];


  // =====================================================
  // SALES OVERVIEW
  // =====================================================

  salesData = [

    { day: 'Mon', value: 55 },
    { day: 'Tue', value: 68 },
    { day: 'Wed', value: 48 },
    { day: 'Thu', value: 76 },
    { day: 'Fri', value: 65 },
    { day: 'Sat', value: 88 },
    { day: 'Sun', value: 72 }

  ];


  // =====================================================
  // SALES SUMMARY
  // =====================================================

  salesSummary = [

    {
      name: 'Cash Sales',
      value: '৳24,650',
      percentage: 58
    },

    {
      name: 'Card / Mobile Banking',
      value: '৳12,400',
      percentage: 29
    },

    {
      name: 'Credit Sales',
      value: '৳5,800',
      percentage: 13
    }

  ];


  // =====================================================
  // INVENTORY STATUS
  // =====================================================

  inventoryStatus = [

    {
      title: 'In Stock',
      value: 1085,
      icon: '🟢',
      class: 'active'
    },

    {
      title: 'Low Stock',
      value: 17,
      icon: '🟡',
      class: 'pending'
    },

    {
      title: 'Expiring Soon',
      value: 9,
      icon: '🔴',
      class: 'suspended'
    }

  ];


  // =====================================================
  // RECENT SALES
  // =====================================================

  recentSales = [

    {
      invoice: 'INV-2026-0148',
      customer: 'Walk-in Customer',
      items: 4,
      amount: '৳1,850',
      payment: 'Paid',
      time: '10:42 AM'
    },

    {
      invoice: 'INV-2026-0147',
      customer: 'Rahim Ahmed',
      items: 6,
      amount: '৳3,240',
      payment: 'Paid',
      time: '10:25 AM'
    },

    {
      invoice: 'INV-2026-0146',
      customer: 'Nusrat Jahan',
      items: 3,
      amount: '৳980',
      payment: 'Paid',
      time: '10:08 AM'
    },

    {
      invoice: 'INV-2026-0145',
      customer: 'Karim Hasan',
      items: 8,
      amount: '৳4,560',
      payment: 'Credit',
      time: '09:46 AM'
    },

    {
      invoice: 'INV-2026-0144',
      customer: 'Walk-in Customer',
      items: 2,
      amount: '৳620',
      payment: 'Paid',
      time: '09:30 AM'
    }

  ];


  // =====================================================
  // LOW STOCK ITEMS
  // =====================================================

  lowStockItems = [

    {
      medicine: 'Napa 500mg',
      category: 'Tablet',
      stock: 12,
      minimum: 50,
      status: 'Critical'
    },

    {
      medicine: 'Seclo 20mg',
      category: 'Capsule',
      stock: 24,
      minimum: 60,
      status: 'Low'
    },

    {
      medicine: 'Azyth 500mg',
      category: 'Tablet',
      stock: 18,
      minimum: 40,
      status: 'Low'
    },

    {
      medicine: 'DP 500mg',
      category: 'Tablet',
      stock: 8,
      minimum: 30,
      status: 'Critical'
    }

  ];


  // =====================================================
  // EXPIRY ALERTS
  // =====================================================

  expiryAlerts = [

    {
      medicine: 'Napa Extra',
      batch: 'NAPA-2408',
      expiry: '30 Sep 2026',
      quantity: 85,
      daysLeft: 17
    },

    {
      medicine: 'Fexo 120mg',
      batch: 'FEX-2406',
      expiry: '15 Oct 2026',
      quantity: 42,
      daysLeft: 32
    },

    {
      medicine: 'Omep 20mg',
      batch: 'OMP-2405',
      expiry: '28 Oct 2026',
      quantity: 36,
      daysLeft: 45
    }

  ];


  // =====================================================
  // QUICK ACTIONS
  // =====================================================

  quickActions = [

    {
      title: 'New Sale',
      description: 'Create a new POS sale',
      icon: '🛒',
      route: '/app/pos'
    },

    {
      title: 'Add Medicine',
      description: 'Add new medicine to inventory',
      icon: '💊',
      route: '/app/inventory/medicines/new'
    },

    {
      title: 'New Purchase',
      description: 'Create purchase order',
      icon: '🧾',
      route: '/app/procurement/purchase-orders/new'
    },

    {
      title: 'Stock Adjustment',
      description: 'Adjust medicine stock',
      icon: '📦',
      route: '/app/inventory/stock-adjustment'
    }

  ];


  constructor(
    private authService: AuthService,
    private tenantService: TenantService
  ) {}


  ngOnInit(): void {

    this.currentTenant =
      this.tenantService.getCurrentTenant();

    const user =
      this.authService.getCurrentUser();

    if (user) {
      this.currentUserName = user.name;
    }

  }


  // =====================================================
  // REFRESH DASHBOARD
  // =====================================================

  refreshDashboard(): void {

    this.currentTenant =
      this.tenantService.getCurrentTenant();

    console.log('Pharmacy dashboard refreshed');

  }


  // =====================================================
  // CURRENT TENANT NAME
  // =====================================================

  getTenantName(): string {

    return this.currentTenant?.name
      || 'My Pharmacy';

  }


  // =====================================================
  // USER GREETING
  // =====================================================

  getGreeting(): string {

    const hour =
      new Date().getHours();

    if (hour < 12) {
      return 'Good morning';
    }

    if (hour < 18) {
      return 'Good afternoon';
    }

    return 'Good evening';

  }

}