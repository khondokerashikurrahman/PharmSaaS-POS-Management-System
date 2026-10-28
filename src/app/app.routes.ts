
import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { tenantGuard } from './core/guards/tenant.guard';

export const routes: Routes = [
  // =========================================================
  // PUBLIC / SAAS PORTAL
  // =========================================================
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component')
        .then(m => m.PublicLayoutComponent),

    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/public/pages/landing/landing.component')
            .then(m => m.LandingComponent)
      },
      {
        path: 'features',
        loadComponent: () =>
          import('./features/public/pages/landing/landing.component')
            .then(m => m.LandingComponent)
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('./features/public/pages/pricing/pricing.component')
            .then(m => m.PricingComponent)
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./features/public/pages/about/about.component')
            .then(m => m.AboutComponent)
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/public/pages/contact/contact.component')
            .then(m => m.ContactComponent)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/public/pages/tenant-registration/tenant-registration.component')
            .then(m => m.TenantRegistrationComponent)
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/public/pages/payment-checkout/payment-checkout.component')
            .then(m => m.PaymentCheckoutComponent)
      },
      {
        path: 'payment-success',
        loadComponent: () =>
          import('./features/public/pages/payment-success/payment-success.component')
            .then(m => m.PaymentSuccessComponent)
      }
    ]
  },

  // =========================================================
  // AUTHENTICATION
  // =========================================================
  {
    path: 'login',
    loadComponent: () =>
      import('./features/public/auth/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/public/auth/forgot-password/forgot-password.component')
        .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/public/auth/reset-password/reset-password.component')
        .then(m => m.ResetPasswordComponent)
  },

  // =========================================================
  // SUPER ADMIN APPLICATION
  // =========================================================
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: {
      roles: ['SUPER_ADMIN']
    },
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),

    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/super-admin/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'tenants',
        loadComponent: () =>
          import('./features/super-admin/tenant-list/tenant-list.component')
            .then(m => m.TenantListComponent)
      },
      {
        path: 'tenant-details',
        loadComponent: () =>
          import('./features/super-admin/tenant-details/tenant-details.component')
            .then(m => m.TenantDetailsComponent)
      },
      {
        path: 'tenant-approval',
        loadComponent: () =>
          import('./features/super-admin/tenant-approval/tenant-approval.component')
            .then(m => m.TenantApprovalComponent)
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./features/super-admin/plan-manager/plan-manager.component')
            .then(m => m.PlanManagerComponent)
      },
      {
        path: 'subscriptions',
        loadComponent: () =>
          import('./features/super-admin/subscription-list/subscription-list.component')
            .then(m => m.SubscriptionListComponent)
      },
      {
        path: 'billing-transactions',
        loadComponent: () =>
          import('./features/super-admin/billing-transactions/billing-transactions.component')
            .then(m => m.BillingTransactionsComponent)
      },
      {
        path: 'billing-logs',
        loadComponent: () =>
          import('./features/super-admin/billing-logs/billing-logs.component')
            .then(m => m.BillingLogsComponent)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/super-admin/platform-users/platform-users.component')
            .then(m => m.PlatformUsersComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./features/super-admin/audit-logs/audit-logs.component')
            .then(m => m.AuditLogsComponent)
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./features/super-admin/support/support.component')
            .then(m => m.SupportComponent)
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/super-admin/platform-settings/platform-settings.component')
            .then(m => m.PlatformSettingsComponent)
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },

  // =========================================================
  // PHARMACY / TENANT APPLICATION
  // =========================================================
  {
    path: 'app',
    canActivate: [authGuard, roleGuard, tenantGuard],
    data: {
      roles: [
        'TENANT_ADMIN',
        'MANAGER',
        'STAFF',
        'STORE_KEEPER'
      ]
    },
    loadComponent: () =>
      import('./layouts/pharmacy-layout/pharmacy-layout.component')
        .then(m => m.PharmacyLayoutComponent),

    children: [
      // =====================================================
      // DASHBOARD
      // =====================================================
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      // =====================================================
      // POS
      // =====================================================
      {
        path: 'pos',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STAFF'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/pos/pos-terminal/pos-terminal.component')
            .then(m => m.PosTerminalComponent)
      },
      {
        path: 'pos/sales-history',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STAFF'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/pos/sales-history/sales-history.component')
            .then(m => m.SalesHistoryComponent)
      },

      // =====================================================
      // INVENTORY - MEDICINES
      // =====================================================
      {
        path: 'inventory',
        pathMatch: 'full',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/medicine-list/medicine-list.component')
            .then(m => m.MedicineListComponent)
      },
      {
        path: 'inventory/medicines',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/medicine-list/medicine-list.component')
            .then(m => m.MedicineListComponent)
      },
      {
        path: 'inventory/medicines/new',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/medicine-form/medicine-form.component')
            .then(m => m.MedicineFormComponent)
      },
      {
        path: 'inventory/medicines/:id/edit',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/medicine-form/medicine-form.component')
            .then(m => m.MedicineFormComponent)
      },
      {
        path: 'inventory/medicines/:id',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/medicine-details/medicine-details.component')
            .then(m => m.MedicineDetailsComponent)
      },

      // =====================================================
      // INVENTORY - STOCK
      // =====================================================
      {
        path: 'inventory/returned-stock',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/returned-stock/returned-stock.component')
            .then(m => m.ReturnedStockComponent)
      },
      {
        path: 'inventory/batches/new',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/batch-form/batch-form.component')
            .then(m => m.BatchFormComponent)
      },
      {
        path: 'inventory/batches',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/batch-expiry-grid/batch-expiry-grid.component')
            .then(m => m.BatchExpiryGridComponent)
      },
      {
        path: 'inventory/stock-adjustment',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/stock-adjustment/stock-adjustment.component')
            .then(m => m.StockAdjustmentComponent)
      },
      {
        path: 'inventory/stock-movement',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/stock-movement/stock-movement.component')
            .then(m => m.StockMovementComponent)
      },
      {
        path: 'inventory/stock-overview',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/stock-overview/stock-overview.component')
            .then(m => m.StockOverviewComponent)
      },
      {
        path: 'inventory/low-stock',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/low-stock/low-stock.component')
            .then(m => m.LowStockComponent)
      },
      {
        path: 'inventory/expiry-alert',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/expiry-alert/expiry-alert.component')
            .then(m => m.ExpiryAlertComponent)
      },

      // =====================================================
      // INVENTORY - COMPANIES AND PRODUCTS
      // =====================================================
      {
        path: 'inventory/companies',
        pathMatch: 'full',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/company-list/company-list.component')
            .then(m => m.CompanyListComponent)
      },
      {
        path: 'inventory/companies/new',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/company-form/company-form.component')
            .then(m => m.CompanyFormComponent)
      },
      {
        path: 'inventory/companies/:id/edit',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/company-form/company-form.component')
            .then(m => m.CompanyFormComponent)
      },
      {
        path: 'inventory/companies/:id',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/company-details/company-details.component')
            .then(m => m.CompanyDetailsComponent)
      },
      {
        path: 'inventory/products',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/product-list/product-list.component')
            .then(m => m.ProductListComponent)
      },
      {
        path: 'inventory/categories',
        loadComponent: () =>
          import('./features/inventory/category-list/product-category-list.component')
            .then(m => m.ProductCategoryListComponent)
      },
      {
        path: 'inventory/generics',
        loadComponent: () =>
          import('./features/inventory/generic-list/generic-list.component')
            .then(m => m.GenericListComponent)
      },
      {
        path: 'inventory/dosage-forms',
        loadComponent: () =>
          import('./features/inventory/dosage-form-list/dosage-form-list.component')
            .then(m => m.DosageFormListComponent)
      },
      {
        path: 'inventory/salesmen',
        pathMatch: 'full',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/sales-man-list/sales-man-list.component')
            .then(m => m.SalesManListComponent)
      },
      {
        path: 'inventory/salesmen/new',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/sales-man-form/sales-man-form.component')
            .then(m => m.SalesManFormComponent)
      },
      {
        path: 'inventory/salesmen/:id/edit',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/sales-man-form/sales-man-form.component')
            .then(m => m.SalesManFormComponent)
      },
      {
        path: 'inventory/salesmen/:id',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/inventory/sales-man-details/sales-man-details.component')
            .then(m => m.SalesManDetailsComponent)
      },

      // =====================================================
      // PROCUREMENT
      // =====================================================
      {
        path: 'procurement',
        pathMatch: 'full',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/procurement/purchase-order-list/purchase-order-list.component')
            .then(m => m.PurchaseOrderListComponent)
      },
      {
        path: 'procurement/purchase-orders',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/procurement/purchase-order-list/purchase-order-list.component')
            .then(m => m.PurchaseOrderListComponent)
      },
      {
        path: 'procurement/purchase-orders/new',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/procurement/purchase-order-form/purchase-order-form.component')
            .then(m => m.PurchaseOrderFormComponent)
      },
      {
        path: 'procurement/purchase-orders/:id/edit',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/procurement/purchase-order-form/purchase-order-form.component')
            .then(m => m.PurchaseOrderFormComponent)
      },
      {
        path: 'procurement/purchase-orders/:id',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/procurement/purchase-order-details/purchase-order-details.component')
            .then(m => m.PurchaseOrderDetailsComponent)
      },
      {
        path: 'procurement/grn',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/procurement/grn-list/grn-list.component')
            .then(m => m.GrnListComponent)
      },
      {
        path: 'procurement/grn/details/:id',
        loadComponent: () =>
          import('./features/procurement/grn-details/grn-details.component')
            .then(m => m.GrnDetailsComponent)
      },
      {
        path: 'procurement/grn/new',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/procurement/grn-entry/grn-entry.component')
            .then(m => m.GrnEntryComponent)
      },
      {
        path: 'procurement/supplier-ledger',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/procurement/supplier-ledger/supplier-ledger.component')
            .then(m => m.SupplierLedgerComponent)
      },
      {
        path: 'procurement/supplier-payment',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/procurement/supplier-payment/supplier-payment.component')
            .then(m => m.SupplierPaymentComponent)
      },
      {
        path: 'procurement/purchase-return',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/procurement/purchase-return/purchase-return.component')
            .then(m => m.PurchaseReturnComponent)
      },

      // =====================================================
      // BRANCH TRANSFER
      // =====================================================
      {
        path: 'branch-transfer',
        pathMatch: 'full',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/branch-transfer/transfer-list/transfer-list.component')
            .then(m => m.TransferListComponent)
      },
      {
        path: 'branch-transfer/new',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/branch-transfer/transfer-form/transfer-form.component')
            .then(m => m.TransferFormComponent)
      },
      {
        path: 'branch-transfer/approval',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/branch-transfer/transfer-approval/transfer-approval.component')
            .then(m => m.TransferApprovalComponent)
      },
      {
        path: 'branch-transfer/receive',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/branch-transfer/transfer-receive/transfer-receive.component')
            .then(m => m.TransferReceiveComponent)
      },
      {
        path: 'branch-transfer/:id/edit',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/branch-transfer/transfer-form/transfer-form.component')
            .then(m => m.TransferFormComponent)
      },
      {
        path: 'branch-transfer/:id',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/branch-transfer/transfer-details/transfer-details.component')
            .then(m => m.TransferDetailsComponent)
      },

      // =====================================================
      // CUSTOMERS
      // =====================================================
      {
        path: 'stakeholders/customers',
        pathMatch: 'full',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STAFF'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/stakeholders/customer-list/customer-list.component')
            .then(m => m.CustomerListComponent)
      },
      {
        path: 'stakeholders/customers/ledger',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STAFF'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/stakeholders/customer-ledger/customer-ledger.component')
            .then(m => m.CustomerLedgerComponent)
      },
      {
        path: 'stakeholders/customers/:id',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STAFF'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/stakeholders/customer-details/customer-details.component')
            .then(m => m.CustomerDetailsComponent)
      },

      // =====================================================
      // SUPPLIERS
      // =====================================================
      {
        path: 'stakeholders/suppliers',
        pathMatch: 'full',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/stakeholders/supplier-list/supplier-list.component')
            .then(m => m.SupplierListComponent)
      },
      {
        path: 'stakeholders/suppliers/ledger',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/stakeholders/supplier-ledger/supplier-ledger.component')
            .then(m => m.SupplierLedgerComponent)
      },
      {
        path: 'stakeholders/suppliers/:id',
        data: { roles: ['TENANT_ADMIN', 'MANAGER', 'STORE_KEEPER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/stakeholders/supplier-details/supplier-details.component')
            .then(m => m.SupplierDetailsComponent)
      },

      // =====================================================
      // REPORTS
      // =====================================================
      {
        path: 'reports',
        pathMatch: 'full',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/reports/reports-dashboard/reports-dashboard.component')
            .then(m => m.ReportsDashboardComponent)
      },
      {
        path: 'reports/sales',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/reports/sales-report/sales-report.component')
            .then(m => m.SalesReportComponent)
      },
      {
        path: 'reports/returns',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/reports/returns-report/returns-report.component')
            .then(m => m.ReturnsReportComponent)
      },
      {
        path: 'reports/purchase',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/reports/purchase-report/purchase-report.component')
            .then(m => m.PurchaseReportComponent)
      },
      {
        path: 'reports/stock',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/reports/stock-report/stock-report.component')
            .then(m => m.StockReportComponent)
      },
      {
        path: 'reports/expiry',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/reports/expiry-report/expiry-report.component')
            .then(m => m.ExpiryReportComponent)
      },
      {
        path: 'reports/profit',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/reports/profit-report/profit-report.component')
            .then(m => m.ProfitReportComponent)
      },
      {
        path: 'reports/cashier',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/reports/cashier-performance/cashier-performance.component')
            .then(m => m.CashierPerformanceComponent)
      },
      {
        path: 'reports/branch',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/reports/branch-performance/branch-performance.component')
            .then(m => m.BranchPerformanceComponent)
      },

           // =====================================================
      // SETTINGS
      // =====================================================

      {
        path: 'settings',
        pathMatch: 'full',
        data: { roles: ['TENANT_ADMIN'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/orgnization-settings/orgnization-settings.component')
            .then(m => m.OrgnizationSettingsComponent)
      },

      // USER REGISTRATION — separate page
      {
        path: 'settings/user-registration',
        data: { roles: ['TENANT_ADMIN'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/user-registration/user-registration.component')
            .then(m => m.UserRegistrationComponent)
      },

      // USER LIST — cards/list page
      {
        path: 'settings/users',
        data: { roles: ['TENANT_ADMIN'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/user-list/user-list.component')
            .then(m => m.UserListComponent)
      },

      {
        path: 'settings/roles',
        data: { roles: ['TENANT_ADMIN'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/role-permission/role-permission.component')
            .then(m => m.RolePermissionComponent)
      },

      {
        path: 'settings/organization',
        data: { roles: ['TENANT_ADMIN'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/orgnization-settings/orgnization-settings.component')
            .then(m => m.OrgnizationSettingsComponent)
      },

      {
        path: 'settings/branches',
        data: { roles: ['TENANT_ADMIN'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/branch-list/branch-list.component')
            .then(m => m.BranchListComponent)
      },

      {
        path: 'settings/pos',
        data: { roles: ['TENANT_ADMIN'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/pos-settings/pos-settings.component')
            .then(m => m.PosSettingsComponent)
      },

      {
        path: 'settings/tax',
        data: { roles: ['TENANT_ADMIN'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/tax-settings/tax-settings.component')
            .then(m => m.TaxSettingsComponent)
      },

      {
        path: 'settings/invoice',
        data: { roles: ['TENANT_ADMIN'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/invoice-settings/invoice-settings.component')
            .then(m => m.InvoiceSettingsComponent)
      },

      {
        path: 'settings/notifications',
        data: { roles: ['TENANT_ADMIN'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/notification-settings/notification-settings.component')
            .then(m => m.NotificationSettingsComponent)
      },

      {
        path: 'settings/payment-methods',
        data: { roles: ['TENANT_ADMIN'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/payment-methods/payment-methods.component')
            .then(m => m.PaymentMethodsComponent)
      },

      {
        path: 'settings/billing',
        data: { roles: ['TENANT_ADMIN'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/billing-history/billing-history.component')
            .then(m => m.BillingHistoryComponent)
      },

      {
        path: 'settings/saas-plan',
        data: { roles: ['TENANT_ADMIN'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/saas-plan/saas-plan.component')
            .then(m => m.SaasPlanComponent)
      },

      {
        path: 'settings/usage',
        data: { roles: ['TENANT_ADMIN', 'MANAGER'] },
        canActivate: [roleGuard],
        loadComponent: () =>
          import('./features/settings/usage/usage.component')
            .then(m => m.UsageComponent)
      },
      // =====================================================
      // DEFAULT PHARMACY ROUTE
      // =====================================================
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      }
    ]
  },

  // =========================================================
  // FALLBACK
  // =========================================================
  {
    path: '**',
    redirectTo: ''
  }
];
