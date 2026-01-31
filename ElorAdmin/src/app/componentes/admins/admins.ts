import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario, UsuarioDTO } from '../../servicios/usuario';
import { AuthService } from '../../servicios/auth';
import { HttpClient } from '@angular/common/http';
import { NgxPaginationModule } from 'ngx-pagination';
import { RouterModule } from '@angular/router';


@Component({
  selector: 'app-admins',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxPaginationModule],
  templateUrl: './admins.html',
  styleUrls: ['./admins.css'],
})
export class Admins implements OnInit {
  // Paginación ✅
  p: number = 1;
  itemsPerPage: number = 10;

  // Modo y permisos
  isGod = false;
  esAdmin = false;
  usuarioActual: UsuarioDTO | null = null;

  // Datos
  usuarios: UsuarioDTO[] = [];
  usuariosFiltrados: UsuarioDTO[] = [];

  // Filtros
  busqueda: string = '';
  rolFiltro: 'profesor' | 'alumno' | 'administrador' | 'god' | 'todos' = 'profesor';
  rolesPermitidos: Array<'profesor' | 'alumno' | 'administrador' | 'god' | 'todos'> = ['todos', 'profesor', 'alumno'];

  // Modal de edición/creación
  editMode = false;
  form: any = { 
    id: null, 
    username: '', 
    nombre: '', 
    apellidos: '', 
    email: '', 
    rol: 'profesor', 
    password: '' 
  };

  // Toast de notificaciones 
  mostrarToast: boolean = false;
  mensajeToast: string = '';
  tipoToast: 'success' | 'error' | 'info' = 'info';

  // Estadísticas (para home de God/Admin)
  totalAlumnos: number = 0;
  totalProfesores: number = 0;
  totalReunionesHoy: number = 0;

  // UI
  loading = false;
  error = '';

  constructor(
    private auth: AuthService,
    private svc: Usuario
  ) {}

  ngOnInit(): void {
    this.verificarPermisos();
    this.cargarUsuarios();
  }

  verificarPermisos(): void {
    this.usuarioActual = this.auth.user;
    const rolActual = String(this.auth.user?.rol || '').toLowerCase();
    this.isGod = rolActual === 'god';
    this.esAdmin = rolActual === 'administrador';

    // Roles permitidos según el tipo de usuario
    if (this.isGod) {
      this.rolesPermitidos = ['todos', 'profesor', 'alumno', 'administrador', 'god'];
    } else if (this.esAdmin) {
      this.rolesPermitidos = ['todos', 'profesor', 'alumno'];
    } else {
      this.rolesPermitidos = ['todos', 'profesor', 'alumno'];
    }
  }

  cargarUsuarios(): void {
    this.loading = true;
    this.error = '';

    // Cargar todos los usuarios (sin filtro inicial)
    this.svc.getUsuarios('profesor', '').subscribe({
      next: (profesores) => {
        this.svc.getUsuarios('alumno', '').subscribe({
          next: (alumnos) => {
            this.usuarios = [...profesores, ...alumnos];
            
            // Si es God, cargar también administradores
            if (this.isGod) {
              this.svc.getUsuarios('administrador', '').subscribe({
                next: (admins) => {
                  this.usuarios = [...this.usuarios, ...admins];
                  this.aplicarFiltros();
                  this.cargarEstadisticas();
                  this.loading = false;
                },
                error: (err) => {
                  this.usuarios = [...profesores, ...alumnos];
                  this.aplicarFiltros();
                  this.cargarEstadisticas();
                  this.loading = false;
                }
              });
            } else {
              this.aplicarFiltros();
              this.cargarEstadisticas();
              this.loading = false;
            }
          },
          error: (err) => {
            this.error = err?.error?.error || 'Error al cargar usuarios';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = err?.error?.error || 'Error al cargar usuarios';
        this.loading = false;
      }
    });
  }

  cargarEstadisticas(): void {
    this.totalAlumnos = this.usuarios.filter(u => u.rol === 'alumno').length;
    this.totalProfesores = this.usuarios.filter(u => u.rol === 'profesor').length;
    // TODO: Cargar reuniones de hoy desde el servicio de reuniones
    this.totalReunionesHoy = 0;
  }

  aplicarFiltros(): void {
    let resultado = [...this.usuarios];

    // Filtrar por rol
    if (this.rolFiltro && this.rolFiltro !== 'todos') {
      resultado = resultado.filter(u => u.rol === this.rolFiltro);
    }

    // Filtrar por búsqueda (nombre, apellidos, username, email)
    if (this.busqueda.trim()) {
      const busquedaLower = this.busqueda.toLowerCase();
      resultado = resultado.filter(u => 
        u.nombre.toLowerCase().includes(busquedaLower) ||
        u.apellidos.toLowerCase().includes(busquedaLower) ||
        u.username.toLowerCase().includes(busquedaLower) ||
        (u.email && u.email.toLowerCase().includes(busquedaLower))
      );
    }

    // Excluir God si el usuario no es God
    if (!this.isGod) {
      resultado = resultado.filter(u => u.rol !== 'god' && u.rol !== 'administrador');
    }

    this.usuariosFiltrados = resultado;
    this.p = 1;
  }

  onBusquedaChange(): void {
    this.aplicarFiltros();
  }

  onRolFiltroChange(): void {
    this.aplicarFiltros();
  }

  // CRUD - Crear Usuario
  nuevo(): void {
    this.editMode = true;
    this.form = { 
      id: null, 
      username: '', 
      nombre: '', 
      apellidos: '', 
      email: '', 
      rol: this.rolFiltro === 'todos' ? 'profesor' : this.rolFiltro, 
      password: '' 
    };
  }

  // CRUD - Editar Usuario
  editar(u: UsuarioDTO): void {
    if (!this.puedeEditar(u)) {
      this.mostrarNotificacion('No tienes permisos para editar este usuario', 'error');
      return;
    }

    this.editMode = true;
    this.form = { 
      id: u.id, 
      username: u.username, 
      nombre: u.nombre, 
      apellidos: u.apellidos, 
      email: u.email, 
      rol: u.rol, 
      password: '' 
    };
  }

  cancelar(): void {
    this.editMode = false;
    this.form = {};
    this.error = '';
  }

  guardar(): void {
    this.error = '';

    // Validación: sólo GOD puede operar con administradores
    const esAdminRol = this.form.rol === 'administrador';
    if (esAdminRol && !this.isGod) {
      this.error = 'Solo GOD puede crear/editar administradores';
      this.mostrarNotificacion(this.error, 'error');
      return;
    }

    const body: any = {
      username: this.form.username,
      nombre: this.form.nombre,
      apellidos: this.form.apellidos,
      email: this.form.email,
      rol: this.form.rol
    };

    // Solo añadir password si se proporciona
    if (this.form.password) {
      body.password = this.form.password;
    }

    if (!this.form.id) {
      // Alta
      this.svc.addUsuario(body).subscribe({
        next: () => {
          this.editMode = false;
          this.cargarUsuarios();
          this.mostrarNotificacion('Usuario creado correctamente', 'success');
        },
        error: (err) => {
          this.error = err?.error?.error || 'Error al crear usuario';
          this.mostrarNotificacion(this.error, 'error');
        }
      });
    } else {
      // Edición
      this.svc.updateUsuario(this.form.id, body).subscribe({
        next: () => {
          this.editMode = false;
          this.cargarUsuarios();
          this.mostrarNotificacion('Usuario actualizado correctamente', 'success');
        },
        error: (err) => {
          this.error = err?.error?.error || 'Error al editar usuario';
          this.mostrarNotificacion(this.error, 'error');
        }
      });
    }
  }

  // CRUD - Eliminar Usuario
  borrar(u: UsuarioDTO): void {
    if (!this.puedeEliminar(u)) {
      this.mostrarNotificacion('No tienes permisos para eliminar este usuario', 'error');
      return;
    }

    // Validación: sólo GOD puede borrar administradores
    if (u.rol === 'administrador' && !this.isGod) {
      this.error = 'Solo GOD puede borrar administradores';
      this.mostrarNotificacion(this.error, 'error');
      return;
    }

    if (!confirm(`¿Seguro que quieres borrar a ${u.apellidos}, ${u.nombre}?`)) return;

    this.svc.deleteUsuario(u.id).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.mostrarNotificacion('Usuario eliminado correctamente', 'success');
      },
      error: (err) => {
        this.error = err?.error?.error || 'Error al borrar usuario';
        this.mostrarNotificacion(this.error, 'error');
      }
    });
  }

  // Sistema de Notificaciones (Toast) ✅
  mostrarNotificacion(mensaje: string, tipo: 'success' | 'error' | 'info'): void {
    this.mensajeToast = mensaje;
    this.tipoToast = tipo;
    this.mostrarToast = true;

    // Auto-ocultar después de 4 segundos
    setTimeout(() => {
      this.cerrarToast();
    }, 4000);
  }

  cerrarToast(): void {
    this.mostrarToast = false;
  }

  // Helpers
  getTipoClass(rol: string): string {
    const clases: { [key: string]: string } = {
      'god': 'badge bg-danger',
      'administrador': 'badge bg-warning text-dark',
      'profesor': 'badge bg-primary',
      'alumno': 'badge bg-success'
    };
    return clases[rol] || 'badge bg-secondary';
  }

  puedeEditar(usuario: UsuarioDTO): boolean {
    if (this.isGod) return true;
    if (usuario.rol === 'god') return false;
    if (usuario.rol === 'administrador' && !this.isGod) return false;
    return true;
  }

  puedeEliminar(usuario: UsuarioDTO): boolean {
    if (usuario.rol === 'god') return false;
    if (usuario.id === this.usuarioActual?.id) return false;
    if (!this.isGod && usuario.rol === 'administrador') return false;
    return true;
  }

  contarUsuarios(): number {
    return this.usuariosFiltrados.length;
  }
}