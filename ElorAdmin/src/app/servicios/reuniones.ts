import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

/**
 * Servicio para gestionar las reuniones con el backend. Sirve para obtener, crear y actualizar reuniones.
 */
export class reuniones {
  // private apiUrl = 'http://localhost:3001';
  private apiUrl = 'http://localhost:3000/api';
  
  constructor(private http: HttpClient) {}

  getAllCentros() {
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/centros`));
  }

  getAllReuniones() {
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/reuniones`));
  }

  getReunionById(id: number) {
    return firstValueFrom(this.http.get<any>(`${this.apiUrl}/reuniones/${id}`));
  }

  createReunion(reunion: any) {
    return firstValueFrom(this.http.post(`${this.apiUrl}/reuniones`, reunion));
  }

  updateReunion(id: number, reunion: any) {
    return firstValueFrom(this.http.put(`${this.apiUrl}/reuniones/${id}`, reunion));
  }

  // Métodos de profesores 
  getProfesores() {
    const headers = new HttpHeaders({ 'x-rol': 'god' }); // Header para permisos 
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/usuarios?rol=profesor`, { headers })
    );
  }

  // Métodos de alumnos 
getAlumnos() {
    const headers = new HttpHeaders({ 'x-rol': 'god' }); // Header para permisos
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/usuarios?rol=alumno`, { headers })
    );
  }

}