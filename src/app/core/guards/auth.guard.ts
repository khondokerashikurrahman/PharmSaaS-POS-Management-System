import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  // User login করা থাকলে access allow
  if (authService.isLoggedIn()) {
    return true;
  }

  // Login না করলে login page
  return router.createUrlTree(['/login']);
};