import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Usuario {

  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // --- Panel God/Admin: Totales ---
  getTotales(): Observable<{alumnos: number, profesores: number, reunionesHoy: number}> {
    return this.http.get<{alumnos: number, profesores: number, reunionesHoy: number}>(`${this.apiUrl}/totales`);
  }

  // --- Listado general de usuarios (parámetros opcionales: rol, filtro, etc) ---
  getUsuarios(params: any = {}): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/usuarios`, { params });
  }

  // --- CRUD administra: Alta ---
  addUsuario(usuario: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/usuarios`, usuario);
  }

  // --- CRUD administra: Editar (requiere usuario.id) ---
  updateUsuario(usuario: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/usuarios/${usuario.id}`, usuario);
  }

  // --- CRUD administra: Baja ---
  deleteUsuario(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/usuarios/${id}`);
  }
}