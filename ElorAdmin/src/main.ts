import { bootstrapApplication } from '@angular/platform-browser';
import { LoginComponent } from './app/componentes/login/login';

bootstrapApplication(LoginComponent)
  .catch(err => console.error(err));