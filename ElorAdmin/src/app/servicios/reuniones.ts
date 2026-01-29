import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

/**
 * Servicio para gestionar las reuniones con el backend. Sirve para obtener, crear y actualizar reuniones.
 */
export class reuniones {
  private apiUrl = 'http://localhost:3001';

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
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/profesores`));
  }

  // Métodos de alumnos 
  getAlumnos() {
    return firstValueFrom(this.http.get<any[]>(`${this.apiUrl}/alumnos`));
  }

}