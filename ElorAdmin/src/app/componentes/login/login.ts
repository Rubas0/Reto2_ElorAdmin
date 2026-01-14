import { Component } from '@angular/core';
import { AuthService } from '../../servicios/auth';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  constructor(private auth: AuthService, private router: Router) {}

  login() {
    if (!this.username || !this.password) {
      this.error = 'Introduce usuario y contraseña';
      return;
    }
    this.auth.login(this.username, this.password).subscribe({
      next: (resp) => {
        if (resp.success) {
          this.auth.setLoggedIn(resp.usuario);
          this.error = '';
          this.router.navigate(['/home']);
        } else {
          this.error = 'Login incorrecto';
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Error al conectar';
      }
    });
  }
}