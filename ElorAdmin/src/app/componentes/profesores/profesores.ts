import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario, UsuarioDTO } from '../../servicios/usuario';
import { AuthService } from '../../servicios/auth';

// Opcional: tipados locales si no exportas DTOs desde el servicio
interface HorarioDTO {
  id: number;
  dia: string;
  hora: number;
  aula?: string;
  observaciones?: string;
  profe?: { id: number; username?: string; nombre?: string; apellidos?: string; argazkiaUrl?: string };
  modulo?: { id: number; nombre: string; nombreEus?: string; horas?: number; curso?: number; ciclo?: { id: number; nombre: string } };
}

interface ReunionDTO {
  id: number;
  estado: string;
  estadoEus?: string;
  titulo: string;
  asunto?: string;
  dia: number;
  semana?: number;
  hora: number;
  aula?: string;
  idCentro?: string;
  profesor?: { id: number; username?: string; nombre?: string; apellidos?: string };
  alumno?: { id: number; nombre?: string; apellidos?: string; argazkiaUrl?: string };
}

interface AlumnoDTO {
  id: number;
  nombre: string;
  apellidos: string;
  argazkiaUrl?: string;
}

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profesores.html',
  styleUrls: ['./profesores.css']
})
export class Profesores implements OnInit {
  // Datos del profesor logueado
  profesor: UsuarioDTO | null = null;

  horarios: HorarioDTO[] = [];
  reuniones: ReunionDTO[] = [];
  alumnos: AlumnoDTO[] = [];
  alumnosFiltrados: AlumnoDTO[] = [];

  // Búsqueda
  busqueda = '';

  // UI
  loading = false;
  error = '';

  constructor(
    private usuarioService: Usuario,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = '';

    const profesorId = this.auth.user?.id;
    if (!profesorId) {
      this.error = 'No se pudo obtener el ID del profesor';
      this.loading = false;
      return;
    }

    // Perfil
    this.usuarioService.getById(profesorId).subscribe({
      next: (profesor: UsuarioDTO) => {
        this.profesor = profesor;
        this.cargarHorario(profesorId);
        this.cargarReuniones(profesorId);
        this.cargarAlumnos(profesorId);
      },
      error: () => {
        this.error = 'Error al cargar datos del profesor';
        this.loading = false;
      }
    });
  }

  cargarHorario(profesorId: number): void {
    this.usuarioService.getHorarioProfesor(profesorId).subscribe({
      next: (horarios: HorarioDTO[]) => {
        this.horarios = horarios || [];
      },
      error: (err) => console.error('Error al cargar horario:', err)
    });
  }

  cargarReuniones(profesorId: number): void {
    this.usuarioService.getReunionesProfesor(profesorId).subscribe({
      next: (reuniones: ReunionDTO[]) => {
        this.reuniones = reuniones || [];
      },
      error: (err) => console.error('Error al cargar reuniones:', err)
    });
  }

  cargarAlumnos(profesorId: number): void {
    // Implementa en tu servicio: puede venir de matriculaciones del ciclo/curso del profesor
    this.usuarioService.getAlumnosProfesor(profesorId).subscribe({
      next: (alumnos: AlumnoDTO[]) => {
        this.alumnos = alumnos || [];
        this.alumnosFiltrados = this.alumnos;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar alumnos:', err);
        this.loading = false;
      }
    });
  }

  buscarAlumno(): void {
    if (!this.busqueda.trim()) {
      this.alumnosFiltrados = this.alumnos;
      return;
    }
    const busq = this.busqueda.toLowerCase();
    this.alumnosFiltrados = this.alumnos.filter((alumno) =>
      (alumno.nombre || '').toLowerCase().includes(busq) ||
      (alumno.apellidos || '').toLowerCase().includes(busq)
    );
  }

  // Si tu template muestra badges de estado (reuniones), añade este helper
  getEstadoBadge(estado: string): string {
    const e = (estado || '').toLowerCase();
    if (e === 'pendiente') return 'bg-warning text-dark';
    if (e === 'aceptada' || e === 'confirmada') return 'bg-success';
    if (e === 'cancelada' || e === 'denegada') return 'bg-danger';
    if (e === 'conflicto') return 'bg-secondary';
    return 'bg-light text-dark';
  }
}