import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../modelos/user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser: User | null = null;

  constructor(private http: HttpClient) {}

  // Lógica de login
  async login(username: string, password: string): Promise<boolean> {
    // Aquí deberías cifrar la password con clave pública antes de enviar (pendiente)
    try {
      const response: any = await this.http.post('/api/usuarios/login', { username, password }).toPromise();
      if (response && response.token) {
        // Guarda token y usuario en localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        this.currentUser = response.user;
        return true;
      }
    } catch {
      //
    }
    return false;
  }

  // Obtener rol del usuario logueado
  getRole(): string | null {
    if (this.currentUser) return this.currentUser.rol;
    const userString = localStorage.getItem('user');
    if (userString) {
      const user = JSON.parse(userString);
      this.currentUser = user;
      return user.rol;
    }
    return null;
  }

  isLogged(): boolean {
    return !!localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser = null;
  }
}