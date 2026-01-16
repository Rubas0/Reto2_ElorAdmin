import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../servicios/auth';

// deja pasar solo si el usuario está autenticado y si no, redirige al login
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const ok = auth.isAuthenticated();
  if (!ok) {
    router.navigate(['/login']);
  }
  return ok;
};