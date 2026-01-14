import { Component } from '@angular/core';
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

  login() {
    if (!this.username || !this.password) {
      this.error = 'Introduce usuario y contraseña';
      return;
    }
    this.error = '';
    alert(`Login correcto para ${this.username} (NO IMPLEMENTADO)`);
  }
}