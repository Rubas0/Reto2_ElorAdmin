// import { bootstrapApplication } from '@angular/platform-browser';
// import { LoginComponent } from './app/componentes/login/login';
// import { provideRouter } from '@angular/router';
// import { provideHttpClient } from '@angular/common/http';
// import { routes } from './app/app.routes';
// import { appConfig } from './app/app.config';




// bootstrapApplication(LoginComponent, { 
//   providers: [
//   provideRouter(routes), 
//   provideHttpClient() // para poder usar HttpClient en los servicios
// ] 
// });

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app/app.component';
import { appConfig } from './app/app.config';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

// Bootstrapea el componente raíz que contiene el router-outlet
// bootstrapApplication(AppComponent, appConfig)
//   .catch(err => console.error(err));

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes)
  ]
}).catch(err => console.error(err));