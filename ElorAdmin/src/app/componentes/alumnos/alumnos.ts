import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../servicios/usuario';
import { AuthService } from '../../servicios/auth';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-alumnos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './alumnos.html',
  styleUrls: ['./alumnos.css']
})
export class Alumnos implements OnInit {
  // Datos del alumno
  alumno: any = null;
  horarios: any[] = [];
  reuniones: any[] = [];
  
  // UI
  loading = false;
  error = '';
  
  // Toast
  showToast = false;
  toastMessage = '';
  toastType:  'success' | 'error' = 'success';

  constructor(
    private svc: Usuario,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = '';
    
    const alumnoId = this.auth.user?. id;
    
    if (! alumnoId) {
      this.error = 'No se pudo obtener el ID del alumno';
      this.loading = false;
      return;
    }

    // Cargar perfil
    this.svc. getById(alumnoId).subscribe({
      next: (alumno) => {
        this.alumno = alumno;
        this.cargarHorario(alumnoId);
        this.cargarReuniones(alumnoId);
      },
      error: (err) => {
        this.error = 'Error al cargar perfil';
        this.loading = false;
        this.mostrarToast(this.error, 'error');
      }
    });
  }

  cargarHorario(alumnoId: number): void {
    this.svc.getHorarioAlumno(alumnoId).subscribe({
      next: (horarios) => {
        this.horarios = horarios;
      },
      error: (err) => {
        console.error('Error al cargar horario:', err);
      }
    });
  }

  cargarReuniones(alumnoId: number): void {
    this.svc.getReunionesAlumno(alumnoId).subscribe({
      next: (reuniones) => {
        this.reuniones = reuniones;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar reuniones:', err);
        this.loading = false;
      }
    });
  }

  getNombreCiclo(cicloId: number): string {
    // Implementar según tu lógica
    return cicloId ?  `Ciclo ${cicloId}` : '-';
  }

  // Obtener clase CSS para el estado de la reunión
getEstadoBadge(estado: string): string {
  const e = (estado || '').toLowerCase();
  if (e === 'pendiente') return 'bg-warning text-dark';
  if (e === 'aceptada') return 'bg-success';
  if (e === 'cancelada' || e === 'denegada') return 'bg-danger';
  if (e === 'conflicto') return 'bg-secondary';
  if (e === 'confirmada') return 'bg-primary';
  return 'bg-light text-dark';
}

  mostrarToast(mensaje: string, tipo: 'success' | 'error') {
    this.toastMessage = mensaje;
    this.toastType = tipo;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  cerrarToast() {
    this.showToast = false;
  }
}