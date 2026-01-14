import { Routes } from '@angular/router';
import { LoginComponent } from './componentes/login/login';
import { Home } from './componentes/home/home';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: Home }, // Redirige aquí si login OK
  { path: '', pathMatch: 'full', redirectTo: 'login' }
];