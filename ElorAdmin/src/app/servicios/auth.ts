import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _isLoggedIn = false;
  private _user: any = null;
  private readonly baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private router: Router) {
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
  // Guardar usuario logueado usando tipo_id para mapear rol si es necesario
  setLoggedIn(usuario: any): void {
    //  Mapear tipo_id a rol si no existe
    if (! usuario.rol && usuario.tipo_id) {
      const tipoMap: Record<number, string> = {
        1: 'god',
        2: 'admin',
        3: 'profesor',
        4: 'alumno'
      };
      usuario.rol = tipoMap[usuario.tipo_id] || '';
    }

    //  Normalizar rol
    if (usuario.rol) {
      usuario.rol = usuario.rol.toLowerCase().trim();
    }

    // Guardar en memoria y localStorage
    this._user = usuario;
    this._isLoggedIn = true;
    localStorage.setItem('user', JSON.stringify(usuario));

    console.log(' Usuario logueado:', usuario);
  }

  // Obtener usuario logueado
   getLoggedUser() {
    if (!this._user) {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        this._user = JSON.parse(storedUser);
      }
    }
    return this._user;
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
    // pruebas debug
  console.log(' authService.getRol() - Usuario:', u);
  console.log(' authService. getRol() - Rol:', u?.rol);
  console.log(' authService.getRol() - tipo_id:', u?.tipo_id);

    return String(u?.rol || '').toLowerCase();
  
  }
  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.user;
  }

  // Logout
  logout() {
    // Limpiar sessionStorage
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token'); // Si usas token JWT
    
    // Limpiar variable local
    this._user = null;
    this._isLoggedIn = false;
    localStorage.removeItem('user');
    
    // Redirigir al login
    this.router.navigate(['/login']);
  }

    // Verificar si está logueado
  isLoggedIn(): boolean {
    return !!this.getLoggedUser();
  }

}