import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login';
import { Home } from './componentes/home/home';
import { God } from './componentes/god/god'; 
import { Admins } from './componentes/admins/admins';
import { roleGuard } from './guards/role.guard';
import { authGuard } from './guards/auth.guard';
import { Alumnos } from './componentes/alumnos/alumnos';
import { Profesores } from './componentes/profesores/profesores';
import { Reuniones } from './componentes/reuniones/reuniones';
import { ReunionDetalle } from './componentes/reunion-detalle/reunion-detalle';

/**
 * Definición de las rutas de la aplicación Angular.
 * Cada ruta está asociada a un componente y puede tener guardias de acceso. Es decir, quién puede acceder a cada ruta.
 */
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'god', component: God, canActivate: [authGuard, roleGuard], data: { roles: ['god'] } },
  { path: 'admins', component: Admins, canActivate: [authGuard, roleGuard], data: { roles: ['admin', 'administrador', 'god'] } },
  { path: 'alumnos', component: Alumnos, canActivate: [authGuard, roleGuard], data: { roles: ['alumno'] } },
  { path: 'profesores', component: Profesores, canActivate: [authGuard, roleGuard], data: { roles: ['profesor'] } },
  { path: 'reuniones', component: Reuniones, canActivate: [authGuard, roleGuard], data: { roles: ['profesor', 'admin', 'administrador', 'god'] } },
  { path: 'reunion-detalle/:id', component: ReunionDetalle, canActivate: [authGuard, roleGuard], data: { roles: ['profesor', 'admin', 'administrador', 'god'] } }, // TODO: falta proteger esta ruta 
  { path: '**', redirectTo: 'login' } // cualquier otra ruta redirige a login
];


/* (home, god, admins) solo son accesibles si el usuario está autenticado. 
Si alguien intenta acceder a la raíz de la aplicación, automáticamente va al login.*/