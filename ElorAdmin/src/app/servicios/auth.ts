import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isLoggedIn = false;
  private _user: any = null;
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {
    // Restaura sesión si hay usuario almacenado
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        this._user = JSON.parse(stored);
        this._isLoggedIn = !!this._user;
      } catch {
        localStorage.removeItem('user');
      }
    }
  }

  // Petición de login al backend
  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login`, { username, password });
  }

  // Marca sesión y guarda usuario
  setLoggedIn(user: any): void {
    this._user = user;
    this._isLoggedIn = true;
    try {
      localStorage.setItem('user', JSON.stringify(user));
    } catch {
      // si el almacenamiento falla, seguimos con sesión en memoria
    }
  }

  // Cierra sesión
  logout(): void {
    this._isLoggedIn = false;
    this._user = null;
    localStorage.removeItem('user');
  }

  // Estado de autenticación
  isAuthenticated(): boolean {
    return this._isLoggedIn;
  }

  // Getter del usuario actual (intenta recuperar de localStorage si no está en memoria)
  get user(): any {
    if (this._user) return this._user;
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        this._user = JSON.parse(stored);
        this._isLoggedIn = !!this._user;
      } catch {
        localStorage.removeItem('user');
      }
    }
    return this._user;
  }

  // Rol en minúsculas del usuario actual
  getRol(): string {
    const u = this.user;
    return String(u?.rol || '').toLowerCase();
  }
}