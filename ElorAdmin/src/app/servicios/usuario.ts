import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

// DTO de usuario usado en listados y formularios
//  DTO -> (Data Transfer Object) es un patrón de diseño que define objetos simples para transferir
//  datos entre diferentes capas de la aplicación, especialmente entre el frontend y el backend.
export interface UsuarioDTO {
  id: number;
  username: string;
  nombre: string;
  apellidos: string;
  email: string;
  tipo_id: number;
  rol: 'god' | 'administrador' | 'admin' | 'profesor' | 'alumno';
}

@Injectable({ providedIn: 'root' })
export class Usuario {

  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

   private headers(): HttpHeaders {
    const rol = String(this.auth.user?.rol || '').toLowerCase();
    return new HttpHeaders({ 'x-rol': rol });
  }

  // --- Panel God/Admin: Totales ---
  getTotales(): Observable<{alumnos: number, profesores: number, reunionesHoy: number}> {
    return this.http.get<{alumnos: number, profesores: number, reunionesHoy: number}>(`${this.apiUrl}/totales`);
  }

  // --- Listado general de usuarios (parámetros opcionales: rol, filtro, etc) ---
getUsuarios(rol?: string, q?: string): Observable<any[]> {
  let params: any = {};
  if (rol) params.rol = rol;
  if (q && q.trim()) params.q = q.trim();
  
  return this.http.get<any[]>(`${this.apiUrl}/usuarios`, { params });
}

  getCiclos(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/ciclos`);
  }

  // --- CRUD administra: Alta ---
  addUsuario(body: { username: string; nombre: string; apellidos: string; email: string; rol: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/usuarios`, body, { headers: this.headers() });
  }

// --- CRUD administra: Modificación ---
   editarUsuario(id: number, body: { nombre: string; apellidos: string; email: string; rol: string; password?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}`, body, { headers: this.headers() });
  }

  // --- CRUD administra: Editar (requiere usuario.id) ---
 // Alias para compatibilidad: delega en editarUsuario
  updateUsuario(id: number, body: { nombre: string; apellidos: string; email: string; rol: string; password?: string }): Observable<any> {
    return this.editarUsuario(id, body);
  }

  // --- CRUD administra: Baja ---
  deleteUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`, { headers: this.headers() });
  }

  // --- CRUD administra: Consulta ---
  // Obtener usuario por ID
  getById(id: number): Observable<UsuarioDTO> {
    return this.http.get<UsuarioDTO>(`${this.apiUrl}/users/${id}`);
  }

  // Obtener horario de un alumno
  getHorarioAlumno(alumnoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/horarios/alumno/${alumnoId}`);
  }

  // Obtener reuniones de un alumno
  getReunionesAlumno(alumnoId:  number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reuniones/alumno/${alumnoId}`);
  }

  // Obtener horario de un profesor
  getHorarioProfesor(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/horarios/profesor/${id}`);
  }
// Obtener reuniones de un profesor
   getReunionesProfesor(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reuniones/profesor/${id}`);
  }
// Obtener alumnos asignados a un profesor
  getAlumnosProfesor(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/profesores/${id}/alumnos`);
  }
}