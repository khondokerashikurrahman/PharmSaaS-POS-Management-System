
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { TenantService } from '../services/tenant.service';

export const tenantGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const tenantService = inject(TenantService);
  const router = inject(Router);

  // ==========================================
  // 1. USER MUST BE LOGGED IN
  // ==========================================

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // ==========================================
  // 2. SUPER ADMIN TENANT PREVIEW
  // ==========================================

  if (authService.isSuperAdmin()) {
    const selectedTenantId = localStorage.getItem(
      'admin_selected_tenant'
    );

    // Super Admin must select a tenant first.
    if (!selectedTenantId) {
      return router.createUrlTree(['/admin/dashboard']);
    }

    const tenant = tenantService.getTenantById(
      selectedTenantId
    );

    // Selected tenant must exist in the demo list.
    if (!tenant) {
      localStorage.removeItem('admin_selected_tenant');
      tenantService.clearCurrentTenant();

      return router.createUrlTree(['/admin/tenants']);
    }

    // Only Active demo tenants can be previewed.
    if (tenant.status !== 'Active') {
      localStorage.removeItem('admin_selected_tenant');
      tenantService.clearCurrentTenant();

      return router.createUrlTree(['/admin/tenants'], {
        queryParams: { reason: 'tenant-not-active' }
      });
    }

    // Save the selected demo tenant.
    const tenantSet = tenantService.setCurrentTenant(
      selectedTenantId
    );

    if (!tenantSet) {
      tenantService.clearCurrentTenant();

      return router.createUrlTree(['/admin/tenants']);
    }

    return true;
  }

  // ==========================================
  // 3. NORMAL TENANT USER ROLE CHECK
  // ==========================================

  const role = authService.getRole();

  const tenantRoles = [
    'TENANT_ADMIN',
    'MANAGER',
    'STAFF',
    'STORE_KEEPER'
  ];

  // Only tenant-side roles may access the pharmacy app.
  if (!role || !tenantRoles.includes(role)) {
    if (role === 'SUPER_ADMIN') {
      return router.createUrlTree(['/admin/dashboard']);
    }

    return router.createUrlTree(['/login']);
  }

  // ==========================================
  // 4. GET BACKEND TENANT ID
  // ==========================================

  const tenantId = authService.getTenantId();

  if (!tenantId) {
    authService.logout();

    return router.createUrlTree(['/login'], {
      queryParams: { reason: 'missing-tenant' }
    });
  }

  // ==========================================
  // 5. SAVE BACKEND TENANT ID
  // ==========================================

  // Backend IDs may be numeric (for example: 1).
  // Do not look for this ID in the frontend demo list.
  const tenantSet = tenantService.setBackendTenantId(
    tenantId
  );

  if (!tenantSet) {
    authService.logout();

    return router.createUrlTree(['/login'], {
      queryParams: { reason: 'invalid-tenant' }
    });
  }

  // ==========================================
  // 6. TENANT ACCESS
  // ==========================================

  // Do not check demo tenant status here.
  // The backend must verify tenant status and permissions
  // before allowing protected pharmacy operations.
  return true;
};
