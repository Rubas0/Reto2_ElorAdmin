import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../servicios/usuario';
import { AuthService } from '../../servicios/auth';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  imports: [CommonModule, FormsModule]
})
export class Home implements OnInit {
  profesores: any[] = [];
  alumnos: any[] = [];
  mostrarProfesores = true; // true = profesores, false = alumnos
  busqueda = '';
  usuario: any = null;

  constructor(
    private usuarioService: Usuario,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.usuario = this.authService.user;
    this.cargarProfesores();
  }

  cargarProfesores() {
    this.usuarioService.getUsuarios('profesor', this.busqueda).subscribe({
      next: (res) => (this.profesores = res),
      error: (err) => console.error('Error al cargar profesores:', err)
    });
  }

  cargarAlumnos() {
    this.usuarioService.getUsuarios('alumno', this.busqueda).subscribe({
      next: (res) => (this.alumnos = res),
      error: (err) => console.error('Error al cargar alumnos:', err)
    });
  }

  cambiarVista(tipo: 'profesor' | 'alumno') {
    this.mostrarProfesores = tipo === 'profesor';
    this.busqueda = '';
    if (tipo === 'profesor') this.cargarProfesores();
    else this.cargarAlumnos();
  }

  buscar() {
    if (this.mostrarProfesores) this.cargarProfesores();
    else this.cargarAlumnos();
  }
}