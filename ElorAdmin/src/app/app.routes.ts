import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login';
import { Home } from './componentes/home/home';
import { God } from './componentes/god/god'; 
import { Admins } from './componentes/admins/admins';
import { roleGuard } from './guards/role.guard';
import { authGuard } from './guards/auth.guard';
import { Alumnos } from './componentes/alumnos/alumnos';
import { Profesores } from './componentes/profesores/profesores';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'god', component: God, canActivate: [authGuard, roleGuard], data: { roles: ['god'] } },
  { path: 'admins', component: Admins, canActivate: [authGuard, roleGuard], data: { roles: ['admin', 'administrador', 'god'] } },
  { path: 'alumnos', component: Alumnos, canActivate: [authGuard, roleGuard], data: { roles: ['alumno'] } },
  { path: 'profesores', component: Profesores, canActivate: [authGuard, roleGuard], data: { roles: ['profesor'] } },
  { path: '**', redirectTo: 'login' } // cualquier otra ruta redirige a login
];


/* (home, god, admins) solo son accesibles si el usuario está autenticado. 
Si alguien intenta acceder a la raíz de la aplicación, automáticamente va al login.*/