import { Component } from '@angular/core';
import { AuthService } from '../../servicios/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JSEncrypt } from 'jsencrypt';
import { PUBLIC_KEY } from '../../../public.key';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  error: string = '';
  loading: boolean = false;
  submitted: boolean = false
  showPassword: boolean = false;

  // Paths inline del icono ojo, para no depender de ficheros externos
  eyePath = 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zm11 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8z';
  eyeOffPath = 'M3.707 2.293 21.707 20.293l-1.414; 1.414-3.016-3.016C15.768 20.288 13.97 21 12 21 5 21 1 12 1 12a23.5 23.5 0 0 1 6.116-7.382L2.293 3.707l1.414-1.414zm8.293 6a4 4 0 0 1 3.999 3.799l-1.62-1.62a2.5 2.5 0 0 0-3.556-3.556l-1.62-1.62A4 4 0 0 1 12 8zm-8.76 3.933A21.7 21.7 0 0 0 12 19c1.646 0 3.192-.446 4.594-1.196l-3.243-3.243A4 4 0 0 1 8.44 9.91l-3.907-3.907a21.7 21.7 0 0 0-1 1.93c-.403.901-.706 1.705-.999 2.9z';

  constructor(private auth: AuthService, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }


  login() {
    this.submitted = true;
    this.error = '';

    if (!this.username || !this.password) {
      this.error = 'Introduce usuario y contraseña';
      return;
    }
    this.loading = true;

    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(PUBLIC_KEY);

    const encryptedPassword = encryptor.encrypt(this.password);
    if (!encryptedPassword) {
      this.loading = false;
      this.error = 'Error cifrando la contraseña';
      return;
    }

    // pasamos 2 argumentos (username, passwordCIFRADA)
    this.auth.login(this.username, encryptedPassword).subscribe({
      next: (resp) => {
        this.loading = false;
        if (resp.success) {
          this.auth.setLoggedIn(resp.usuario);
          const rol = String(
            resp.usuario?.rol ??
            (resp.usuario?.tipo_id === 1 ? 'god' :
             resp.usuario?.tipo_id === 2 ? 'admin' :
             resp.usuario?.tipo_id === 3 ? 'profesor' :
             resp.usuario?.tipo_id === 4 ? 'alumno' : '')
          ).toLowerCase();

          if (rol === 'god') { // administrador supremo y redierccionamientos
            this.router.navigate(['/god']); 
          } else if (rol === 'admin' || rol === 'administrador' || rol === 'administradores' || rol === 'secretaria') {
            this.router.navigate(['/admins']);
          } else if (rol === 'profesor') {
            this.router.navigate(['/profesores']);
          } else if (rol === 'alumno') {
            this.router.navigate(['/alumnos']);
          } else {
            this.router.navigate(['/home']);
          }
        } else {
          this.error = 'Login incorrecto';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.error || 'Error al conectar';
      }
    });
  }

  forgotPassword() {
    // TODO: Hacer una llamada al backend (index.js) que inicie el proceso real.
    this.error = 'Funcionalidad no implementada, contacta con Secretaría.';
  }
}