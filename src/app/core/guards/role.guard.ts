import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  UrlTree
} from '@angular/router';

import { AuthService } from '../services/auth.service';
import { PermissionService } from '../services/permission.service';
import { UserRole } from '../models/user.model';

export const roleGuard: CanActivateFn = (
  route,
  state
): boolean | UrlTree => {

  const authService = inject(AuthService);
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  const currentRole = authService.getRole();
  const path = state.url.split(/[?#]/)[0];

  // The tenant guard separately controls Super Admin preview.
  if (path === '/app' || path.startsWith('/app/')) {
    if (currentRole === 'SUPER_ADMIN') {
      return true;
    }

    if (permissionService.canAccessUrl(state.url)) {
      return true;
    }

    if (authService.isTenantUser()) {
      return router.createUrlTree(['/app/dashboard'], {
        queryParams: { denied: 'role' }
      });
    }

    return router.createUrlTree(['/login']);
  }

  const allowedRoles = route.data?.['roles'] as
    UserRole[] | undefined;

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  if (currentRole && allowedRoles.includes(currentRole)) {
    return true;
  }

  if (currentRole === 'SUPER_ADMIN') {
    return router.createUrlTree(['/admin/dashboard']);
  }

  if (authService.isTenantUser()) {
    return router.createUrlTree(['/app/dashboard'], {
      queryParams: { denied: 'role' }
    });
  }

  return router.createUrlTree(['/login']);
};
