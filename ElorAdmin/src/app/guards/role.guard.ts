import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../servicios/auth';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Debe estar autenticado primero
  if (!auth.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Roles permitidos declarados en la ruta
  const allowed = (route.data?.['roles'] as string[] | undefined) ?? [];

  // Rol del usuario actual, con fallback por tipo_id
  const userRol = String(
    auth.getRol?.() ??
    (auth.user?.rol ?? (auth.user?.tipo_id === 1 ? 'god' :
                        auth.user?.tipo_id === 2 ? 'admin' :
                        auth.user?.tipo_id === 3 ? 'profesor' :
                        auth.user?.tipo_id === 4 ? 'alumno' : ''))
  ).toLowerCase();

  if (allowed.length === 0) return true;

  const ok = allowed.map(r => r.toLowerCase()).includes(userRol);
  if (!ok) {
    // Redirige a home si tiene sesión pero no permiso; si no, al login
    router.navigate(['/home']);
  }
  return ok;
};