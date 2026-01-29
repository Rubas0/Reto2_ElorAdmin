import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../servicios/usuario';
import { JSEncrypt } from 'jsencrypt';
import { PUBLIC_KEY } from '../../../public.key';
@Component({
  selector: 'app-god',
  standalone: true,
  templateUrl: './god.html',
  styleUrls: ['./god.css'],
  imports: [CommonModule, FormsModule],
})
export class God implements OnInit {
  totales = { alumnos: 0, profesores: 0, reunionesHoy: 0 };
  admins: any[] = [];
  showForm = false;
  editando = false;
  submitted = false;
  form: any = { username: '', nombre: '', apellidos: '', email: '', password: '' };
  formError = '';
  adminEditId: number | null = null;

 // Toast
  showToast = false;
  toastMessage = '';
  toastType:  'success' | 'error' = 'success';

  constructor(private usuarioService: Usuario) {}

  ngOnInit() {
    this.cargarTotales();
    this.cargarAdmins();
  }

  cargarTotales() {
    this.usuarioService.getTotales().subscribe(
      res => this.totales = res,
      err => { this.totales = { alumnos: 0, profesores: 0, reunionesHoy: 0 }; }
    );
  }

  cargarAdmins() {
    this.usuarioService.getUsuarios('admin').subscribe(res => {
      this.admins = res;
    });
  }

  nuevoAdmin() {
    this.showForm = true;
    this.editando = false;
    this.form = { username: '', nombre: '', apellidos: '', email: '', password: '' };
    this.formError = '';
    this.submitted = false;
    this.adminEditId = null;
  }

  editarAdmin(admin: any) {
    this.showForm = true;
    this.editando = true;
    this.form = {
      username: admin.username,
      nombre: admin.nombre,
      apellidos: admin.apellidos,
      email: admin.email,
      password: ''
    };
    this.formError = '';
    this.submitted = false;
    this.adminEditId = admin.id;
  }

  borrarAdmin(admin: any) {
    if (admin.username === 'goduser') {
      this.mostrarToast('No se puede borrar al usuario god', 'error');
      return;
    }
    if (confirm('¿Seguro que quieres borrar este administrador?')) {
      this.usuarioService.deleteUsuario(admin.id).subscribe({
        next: () => {
          this.cargarAdmins();
          this.mostrarToast('Administrador eliminado correctamente', 'success');
        },
        error: () => {
          this.mostrarToast('Error al eliminar administrador', 'error');
        }
      });
    }
  }

  guardarAdmin() {
    this.submitted = true;
    this.formError = '';
    if (!this.form.username || !this.form.nombre || !this.form.apellidos || !this.form.email || (!this.editando && !this.form.password)) {
      this.mostrarToast('Rellena todos los campos obligatorios', 'error');
      return;
    }

      // Cifrar password 
  // const encrypt = new JSEncrypt();
  // encrypt.setPublicKey(PUBLIC_KEY);

  // let data: any = { ...this.form, rol: 'admin' };
  // if (this.form.password) {
  //   const encryptedPassword = encrypt.encrypt(this.form.password);
  //   data.password = encryptedPassword;
  // } else {
  //   delete data.password; // si está vacío, no mandes la password
  // }

    if (this.editando && this.adminEditId !== null) {
      // Si no cambiamos password, evitar enviarla vacía
      const data = { ...this.form, id: this.adminEditId, rol: 'admin' };
      if (!data.password) delete data.password;

        this.usuarioService.updateUsuario(this.adminEditId, data).subscribe({
        next: () => {
          this.cargarAdmins();
          this.cancelar();
          this.mostrarToast('Administrador actualizado correctamente', 'success');
        },
        error: () => {
          this.mostrarToast('Error al actualizar administrador', 'error');
        }
      });
    } else {
      this.usuarioService.addUsuario({ ...this.form, rol: 'admin' }).subscribe({
        next: () => {
          this.cargarAdmins();
          this.cancelar();
          this.mostrarToast('Administrador creado correctamente', 'success');
        },
        error: () => {
          this.mostrarToast('Error al crear administrador', 'error');
        }
      });
    }
  }

  cancelar() {
    this.showForm = false;
    this.editando = false;
    this.formError = '';
    this.submitted = false;
    this.form = { username: '', nombre: '', apellidos: '', email: '', password: '' };
    this.adminEditId = null;
  }
  
  // Método para mostrar toast
  mostrarToast(mensaje: string, tipo: 'success' | 'error') {
    this.toastMessage = mensaje;
    this.toastType = tipo;
    this.showToast = true;

    // Ocultar automáticamente después de 3 segundos
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  cerrarToast() {
    this.showToast = false;
  }
  
}