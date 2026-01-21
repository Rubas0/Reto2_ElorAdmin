import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario, UsuarioDTO } from '../../servicios/usuario';
import { AuthService } from '../../servicios/auth';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admins',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admins.html',
  styleUrls: ['./admins.css']
})
export class Admins implements OnInit {
  // Permisos
  isGod = false;

  // Filtros y búsqueda
  allowedRoles: Array<'profesor' | 'alumno' | 'administrador'> = ['profesor', 'alumno'];
  rolFiltro: 'profesor' | 'alumno' | 'administrador' = 'profesor';
  q = '';

  // Datos y UI
  usuarios: UsuarioDTO[] = [];
  page = 1;
  pageSize = 10;
  loading = false;
  error = '';

  // Formulario
  editMode = false;
  form: any = { id: null, username: '', nombre: '', apellidos: '', email: '', rol: 'profesor', password: '' };

    // Toast
  showToast = false;
  toastMessage = '';
  toastType:  'success' | 'error' = 'success';

  constructor(private svc: Usuario, private auth: AuthService) {}

  ngOnInit(): void {
    const rolActual = String(this.auth.getRol()).toLowerCase();
    this.isGod = rolActual === 'god';
    this.allowedRoles = this.isGod ? ['profesor', 'alumno', 'administrador'] : ['profesor', 'alumno'];
    this.rolFiltro = this.allowedRoles[0];
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = '';
    this.svc.getUsuarios(this.rolFiltro, this.q).subscribe({
      next: (list) => { this.usuarios = list; this.loading = false; this.page = 1; },
      error: (err) => { this.error = err?.error?.error || 'Error al cargar usuarios'; this.loading = false; }
    });
  }

  buscar(): void { this.cargar(); }

  nuevo(): void {
    this.editMode = true;
    this.form = { id: null, username: '', nombre: '', apellidos: '', email: '', rol: this.rolFiltro, password: '' };
  }

  editar(u: UsuarioDTO): void {
    this.editMode = true;
    this.form = { id: u.id, username: u.username, nombre: u.nombre, apellidos: u.apellidos, email: u.email, rol: (u.rol === 'administrador' ? 'administrador' : u.rol), password: '' };
  }

  cancelar(): void { this.editMode = false; this.form = {}; }

  guardar(): void {
    this.error = '';

    const esAdminRol = this.form.rol === 'administrador';
    if (esAdminRol && !this.isGod) {
      this.error = 'Solo GOD puede crear/editar administradores';
      return;
    }

    const body = {
      username: this.form.username,
      nombre: this.form.nombre,
      apellidos: this.form.apellidos,
      email: this.form.email,
      rol: this.form.rol,
      password: this.form.password
    };

    if (!this.form.id) {
      this.svc.addUsuario(body as any).subscribe({
        next: () => { this.editMode = false; this.cargar(); },
        error: (err) => { this.error = err?.error?.error || 'Error al crear usuario'; }
      });
    } else {
      const updBody = { ...body };
      if (!updBody.password) delete (updBody as any).password;
      this.svc.updateUsuario(this.form.id, updBody as any).subscribe({
        next: () => { this.editMode = false; this.cargar(); },
        error: (err) => { this.error = err?.error?.error || 'Error al editar usuario'; }
      });
    }
  }

  borrar(u: UsuarioDTO): void {
    if ((u.rol === 'administrador') && !this.isGod) {
      this.error = 'Solo GOD puede borrar administradores';
      return;
    }
    if (!confirm(`¿Seguro que quieres borrar a ${u.apellidos}, ${u.nombre}?`)) return;
    this.svc.deleteUsuario(u.id).subscribe({
      next: () => this.cargar(),
      error: (err) => { this.error = err?.error?.error || 'Error al borrar usuario'; }
    });
  }

  get paged(): UsuarioDTO[] {
    const start = (this.page - 1) * this.pageSize;
    return this.usuarios.slice(start, start + this.pageSize);
  }
}