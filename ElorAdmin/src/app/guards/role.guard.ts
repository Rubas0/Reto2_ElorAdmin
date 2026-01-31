import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../servicios/auth';

/**
 * Guard para proteger rutas según el rol del usuario.
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Debe estar autenticado primero
  if (!auth.isAuthenticated()) {
    console.warn(' roleGuard - Usuario no autenticado');
    router.navigate(['/login']);
    return false;
  }

  // Roles permitidos declarados en la ruta
  const allowed = (route.data?.['roles'] as string[] | undefined) ?? [];

  //  OBTENER ROL DEL USUARIO (con fallback robusto)
  let userRol = '';

  // 1. Intentar obtener de auth.getRol()
  if (auth.getRol && typeof auth.getRol === 'function') {
    userRol = auth.getRol();
  }

  // 2.  Si no existe, intentar auth.user.rol
  if (! userRol && auth.user?. rol) {
    userRol = auth.user.rol;
  }

  // 3.  Si no existe, mapear tipo_id a rol
  if (!userRol && auth. user?.tipo_id) {
    const tipoMap:  Record<number, string> = {
      1: 'god',
      2: 'admin',
      3: 'profesor',
      4: 'alumno'
    };
    userRol = tipoMap[auth.user.tipo_id] || '';
  }

  // Normalizar a minúsculas
  userRol = String(userRol).toLowerCase().trim();

  // DEBUG TEMPORAL, quitar cuando esté estable y entregable final
  console.log('🔍 roleGuard - Ruta:', route.url);
  console.log('🔍 roleGuard - Roles permitidos:', allowed);
  console.log('🔍 roleGuard - Usuario (auth.user):', auth.user);
  console.log('🔍 roleGuard - Rol calculado:', userRol);

  // Si no hay restricción de roles, permitir
  if (allowed.length === 0) {
    console.log(' roleGuard - Sin restricciones de rol');
    return true;
  }

  // Comprobar si el rol del usuario está en los permitidos
  const allowedLower = allowed.map(r => r.toLowerCase().trim());
  const ok = allowedLower.includes(userRol);

  if (!ok) {
    console.warn(' roleGuard - Acceso denegado');
    console.warn(' roleGuard - Rol requerido:', allowedLower);
    console.warn(' roleGuard - Rol del usuario:', userRol);
    router.navigate(['/home']);
  } else {
    console.log(' roleGuard - Acceso permitido');
  }

  return ok;
};