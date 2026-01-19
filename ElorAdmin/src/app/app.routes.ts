import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login';
import { Home } from './componentes/home/home';
import { God } from './componentes/god/god'; 
import { Admins } from './componentes/admins/admins';
import { roleGuard } from './guards/role.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'god', component: God, canActivate: [authGuard, roleGuard], data: { roles: ['god'] } },
  { path: 'admins', component: Admins, canActivate: [authGuard, roleGuard], data: { roles: ['admin', 'god'] } },
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' }
];


/*
(home, god, admins) solo son accesibles si el usuario está autenticado. 
Si alguien intenta acceder a la raíz de la aplicación, automáticamente va al login.
*/