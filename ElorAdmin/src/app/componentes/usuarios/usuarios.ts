import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../servicios/auth';
import { Usuario as UsuarioService, UsuarioDTO } from '../../servicios/usuario';
import { HttpParams } from '@angular/common/http';
import {JSEncrypt } from 'jsencrypt';
import { PUBLIC_KEY } from '../../../public.key';
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.css'],
})

// Constructor: Solo para inyección de dependencias y asignaciones simples de propiedades.
// ngOnInit: Para cualquier lógica de inicialización, llamadas a servicios, suscripciones 
// y configuración que dependa de los inputs del componente.

export class Usuarios implements OnInit {
  // Modo y permisos
  manageAdmins = false;  // true si la ruta lleva data.manageAdmins y el usuario es god
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

  // Paginación simple en cliente
  get paged() {
    const start = (this.page - 1) * this.pageSize;
    return Array.isArray(this.usuarios) ? this.usuarios.slice(start, start + this.pageSize) : [];
  }

  // Formulario
  editMode = false;
  form: any = { id: null, username: '', nombre: '', apellidos: '', email: '', rol: 'profesor', password: '' };

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private svc: UsuarioService
  ) {}

  ngOnInit(): void {
    const data = this.route.snapshot.data || {};
    this.manageAdmins = !!data['manageAdmins'];
    const rolActual = String(this.auth.user?.rol || '').toLowerCase();
    this.isGod = rolActual === 'god';

    // Roles permitidos en la UI
    this.allowedRoles = this.manageAdmins && this.isGod ? ['profesor', 'alumno', 'administrador'] : ['profesor', 'alumno'];
    this.rolFiltro = this.allowedRoles[0];

    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = '';
    const filtroRol = this.rolFiltro;
    this.svc.getUsuarios(filtroRol, this.q).subscribe({
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

    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(PUBLIC_KEY);

    // Validación: sólo GOD en modo manageAdmins puede operar con administradores
    const esAdminRol = this.form.rol === 'administrador';
    if (esAdminRol && !(this.manageAdmins && this.isGod)) {
      this.error = 'Solo GOD puede crear/editar administradores';
      return;
    }

    let body = {
      username: this.form.username,
      nombre: this.form.nombre,
      apellidos: this.form.apellidos,
      email: this.form.email,
      rol: this.form.rol,
      password: this.form.password
    };

      if (this.form.password) {
    const encryptedPassword = encryptor.encrypt(this.form.password);
    body = { ...body, password: encryptedPassword };
  }

    if (!this.form.id) {
      // Alta
      this.svc.addUsuario(body as any).subscribe({
        next: () => { this.editMode = false; this.cargar(); },
        error: (err) => { this.error = err?.error?.error || 'Error al crear usuario'; }
      });
    } else {
      // Edición
      const updBody = { ...body };
      // Si no se cambia la password, no enviarla
      if (!updBody.password) delete (updBody as any).password;

      // pasamos los 2 parámetros requeridos: id y body
      this.svc.updateUsuario(this.form.id, updBody).subscribe({
      next: () => { this.editMode = false; this.cargar(); },
      error: (err) => { this.error = err?.error?.error || 'Error al editar usuario'; }
    });
    }
  }

  borrar(u: UsuarioDTO): void {
    // Validación: sólo GOD puede borrar administradores; nunca goduser (lo controla el backend también)
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
}
