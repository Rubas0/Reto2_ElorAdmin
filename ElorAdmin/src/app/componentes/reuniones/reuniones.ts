import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../servicios/usuario';
import { AuthService } from '../../servicios/auth';

interface Centro {
  codigo: string;
  nombre: string;
  dtituc: string;
  dterre: string;
  dmunic: string;
  lat: number;
  lon: number;
}

@Component({
  selector:  'app-reuniones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reuniones.html',
  styleUrls: ['./reuniones.css']
})
export class Reuniones implements OnInit {
  // Datos
  centros: Centro[] = [];
  centrosFiltrados: Centro[] = [];
  
  // Filtros
  dtitucOptions: string[] = [];
  dterreOptions: string[] = [];
  dmunicOptions: string[] = [];
  
  filtroActual = {
    dtituc: '',
    dterre: '',
    dmunic: ''
  };
  
  // Paginación
  page = 1;
  pageSize = 10;
  
  // Permisos
  puedeCrearReunion = false;
  
  // UI
  loading = false;
  error = '';
  
  constructor(
    private usuarioService: Usuario,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.verificarPermisos();
    this.cargarCentros();
  }

  verificarPermisos(): void {
    const rol = this.auth.getRol();
    this.puedeCrearReunion = (rol === 'profesor');
  }

  cargarCentros(): void {
    this.loading = true;
    
    // Cargar desde JSON (EuskadiLatLon. json)
    fetch('assets/data/EuskadiLatLon.json')
      .then(res => res.json())
      .then(data => {
        this.centros = data;
        this.extraerOpcionesFiltros();
        this.aplicarFiltros();
        this.loading = false;
      })
      .catch(err => {
        this.error = 'Error al cargar centros';
        this.loading = false;
      });
  }

  extraerOpcionesFiltros(): void {
    // Extraer valores únicos
    this.dtitucOptions = ['Todos', ... new Set(this.centros. map(c => c.dtituc))].sort(); // Añadir 'Todos' al inicio
  }

  onDtitucChange(): void {
    this.filtroActual.dterre = '';
    this.filtroActual.dmunic = '';
    
    if (this. filtroActual.dtituc && this.filtroActual.dtituc !== 'Todos') {
      const centrosFiltrados = this.centros.filter(c => c.dtituc === this.filtroActual.dtituc);
      this. dterreOptions = ['Todos', ...new Set(centrosFiltrados.map(c => c. dterre))].sort();
    } else {
      this. dterreOptions = [];
    }
    
    this. dmunicOptions = [];
    this.aplicarFiltros();
  }

  onDterreChange(): void {
    this.filtroActual.dmunic = '';
    
    if (this.filtroActual. dterre && this.filtroActual.dterre !== 'Todos') {
      const centrosFiltrados = this.centros.filter(c => 
        c.dtituc === this.filtroActual.dtituc && c.dterre === this.filtroActual.dterre
      );
      this.dmunicOptions = ['Todos', ...new Set(centrosFiltrados.map(c => c.dmunic))].sort();
    } else {
      this.dmunicOptions = [];
    }
    
    this.aplicarFiltros();
  }

  onDmunicChange(): void {
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let resultado = [... this.centros];
    
    if (this.filtroActual. dtituc && this.filtroActual.dtituc !== 'Todos') {
      resultado = resultado.filter(c => c.dtituc === this.filtroActual.dtituc);
    }
    
    if (this.filtroActual. dterre && this.filtroActual.dterre !== 'Todos') {
      resultado = resultado.filter(c => c.dterre === this.filtroActual.dterre);
    }
    
    if (this.filtroActual.dmunic && this.filtroActual. dmunic !== 'Todos') {
      resultado = resultado.filter(c => c.dmunic === this.filtroActual. dmunic);
    }
    
    this.centrosFiltrados = resultado;
    this.page = 1;
  }

  get paged(): Centro[] {
    const start = (this.page - 1) * this.pageSize;
    return this.centrosFiltrados. slice(start, start + this. pageSize);
  }

  get totalPages(): number {
    return Math.ceil(this.centrosFiltrados.length / this.pageSize);
  }
}