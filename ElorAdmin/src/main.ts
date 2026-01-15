import { bootstrapApplication } from '@angular/platform-browser';
import { LoginComponent } from './app/componentes/login/login';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app/app.routes';

// bootstrapApplication(LoginComponent)
//   .catch(err => console.error(err));

bootstrapApplication(LoginComponent, { 
  providers: [
  provideRouter(routes), 
  provideHttpClient() // para poder usar HttpClient en los servicios
] 
});