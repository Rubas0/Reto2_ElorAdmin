import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../servicios/usuario';
import { AuthService } from '../../servicios/auth';

@Component({
  selector: 'app-profesores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profesores.html',
  styleUrls: ['./profesores.css']
})
export class Profesores implements OnInit {
  profesor: any = null;
  profesores: any[] = [];
  alumnos: any[] = [];    
  mostrarProfesores = true;
  busqueda = '';
  loading = false;
  error = '';

  constructor(
    private usuarioService: Usuario,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.profesor = this.auth.user;
    
    if (!this.profesor) {
      this.error = 'No se pudo obtener el usuario logueado';
      return;
    }

    console.log('Usuario logueado:', this.profesor);
    
    // Retrasa la carga inicial para evitar error NG0100 de angular 
    setTimeout(() => this.cargarProfesores(), 0);
  }

  cargarProfesores(): void {
    this.loading = true;
    this.error = '';
    
    this.usuarioService.getUsuarios('profesor', this.busqueda).subscribe({
      next: (res) => {
        this.profesores = res || [];
        this.loading = false;
        console.log('✅ Profesores cargados:', this.profesores.length);
      },
      error: (err) => {
        console.error('Error al cargar profesores:', err);
        this.error = 'Error al cargar profesores';
        this.profesores = [];  // Resetea a array vacío en caso de error
        this.loading = false;
      }
    });
  }

  cargarAlumnos(): void {
    this.loading = true;
    this.error = '';
    
    this.usuarioService.getUsuarios('alumno', this.busqueda).subscribe({
      next: (res) => {
        this.alumnos = res || []; //Asegura que siempre sea un array
        this.loading = false;
        console.log('✅ Alumnos cargados:', this.alumnos.length);
      },
      error: (err) => {
        console.error('Error al cargar alumnos:', err);
        this.error = 'Error al cargar alumnos';
        this.alumnos = []; // Resetea a array vacío en caso de error
        this.loading = false;
      }
    });
  }

  cambiarVista(tipo: 'profesor' | 'alumno'): void {
    this.mostrarProfesores = tipo === 'profesor';
    this.busqueda = '';
    this.error = '';
    
    if (tipo === 'profesor') {
      this.cargarProfesores();
    } else {
      this.cargarAlumnos();
    }
  }

  buscar(): void {
    this.error = '';
    if (this.mostrarProfesores) {
      this.cargarProfesores();
    } else {
      this.cargarAlumnos();
    }
  }

  limpiarBusqueda(): void {
    this.busqueda = '';
    this.buscar();
  }
}