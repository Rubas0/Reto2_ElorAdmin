import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../servicios/usuario';
import { AuthService } from '../../servicios/auth';
import { NgxPaginationModule } from 'ngx-pagination';
import { reuniones } from '../../servicios/reuniones';
import { RouterModule } from '@angular/router';
 

interface Centro {
  id?: number;
  codigo: string;
  nombre: string;
  dtituc: string;
  dterre: string;
  dmunic: string;
  lat: number;
  lon: number;
  direccion?: string;
}

interface Reunion {
  id: number;
  titulo: string;
  tema: string;
  fecha: string;
  hora: string;
  aula: string;
  estado: 'Pendiente' | 'Aceptada' | 'Cancelada' | 'Conflicto';
  centroId: number;
  profesorId: number;
  alumnoId: number;
  centro?: Centro;
}

@Component({
  selector: 'app-reuniones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgxPaginationModule],
  templateUrl: './reuniones.html',
  styleUrls: ['./reuniones.css'],
})
export class Reuniones implements OnInit {
  // Paginación ✅
  p: number = 1;
  itemsPerPage: number = 10;

  // Datos principales
  reunionesList: Reunion[] = [];
  filteredReuniones: Reunion[] = [];
  centrosList: Centro[] = [];
  
  // Filtros
  tiposCentro: string[] = [];
  territorios: string[] = [];
  municipios: string[] = [];
  
  tipoCentroSeleccionado: string = '';
  territorioSeleccionado: string = '';
  municipioSeleccionado: string = '';

  // Mapeo normalizado de territorios
  readonly MAPA_TERRITORIOS: { [key: string]: string } = {
    'bizkaia': 'Bizkaia',
    'vizcaya': 'Bizkaia',
    'gipuzkoa': 'Gipuzkoa',
    'guipuzcoa': 'Gipuzkoa',
    'guipúzcoa': 'Gipuzkoa',
    'araba': 'Araba',
    'álava': 'Araba',
    'alava': 'Araba'
  };

  constructor(private reunionesService: reuniones) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  async cargarDatos() {
    try {
      // Cargar centros desde EuskadiLatLon.json
      const response = await fetch('assets/data/EuskadiLatLon.json');
      this.centrosList = await response.json();
      
      // Normalizar territorios
      this.centrosList.forEach((centro, index) => {
        centro.id = index + 1; // Asignar ID si no existe
        const territorioNormalizado = this.normalizarTerritorio(centro.dterre);
        centro.dterre = territorioNormalizado;
      });

      // Cargar reuniones desde json-server
      this.reunionesList = await this.reunionesService.getAllReuniones();
      
      // Enriquecer reuniones con datos del centro
      this.reunionesList = this.reunionesList.map(reunion => ({
        ...reunion,
        centro: this.centrosList.find(c => c.id === reunion.centroId)
      }));

      this.filteredReuniones = [...this.reunionesList];
      
      // Inicializar filtros
      this.tiposCentro = this.getTiposCentroUnicos();
      this.territorios = this.getTerritoriosUnicos();
      this.municipios = this.getMunicipiosGlobales();
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  normalizarTerritorio(territorio: string): string {
    const territorioLower = territorio.trim().toLowerCase();
    return this.MAPA_TERRITORIOS[territorioLower] || territorio.trim();
  }

  getTiposCentroUnicos(): string[] {
    const tipos = new Set(this.centrosList.map(c => c.dtituc));
    return ['Todos', ...Array.from(tipos)].sort();
  }

  getTerritoriosUnicos(): string[] {
    const territorios = new Set(this.centrosList.map(c => c.dterre));
    return Array.from(territorios).sort();
  }

  getMunicipiosGlobales(): string[] {
    const municipios = new Set(this.centrosList.map(c => c.dmunic));
    return Array.from(municipios).sort();
  }

  onTipoCentroChange() {
    this.territorioSeleccionado = '';
    this.municipioSeleccionado = '';
    this.actualizarTerritorios();
    this.aplicarFiltros();
  }

  onTerritorioChange() {
    this.municipioSeleccionado = '';
    this.actualizarMunicipios();
    this.aplicarFiltros();
  }

  onMunicipioChange() {
    this.aplicarFiltros();
  }

  actualizarTerritorios() {
    if (!this.tipoCentroSeleccionado || this.tipoCentroSeleccionado === 'Todos') {
      this.territorios = this.getTerritoriosUnicos();
    } else {
      const centrosFiltrados = this.centrosList.filter(
        c => c.dtituc === this.tipoCentroSeleccionado
      );
      const territorios = new Set(centrosFiltrados.map(c => c.dterre));
      this.territorios = Array.from(territorios).sort();
    }
  }

  actualizarMunicipios() {
    let centrosFiltrados = this.centrosList;

    if (this.tipoCentroSeleccionado && this.tipoCentroSeleccionado !== 'Todos') {
      centrosFiltrados = centrosFiltrados.filter(
        c => c.dtituc === this.tipoCentroSeleccionado
      );
    }

    if (this.territorioSeleccionado) {
      centrosFiltrados = centrosFiltrados.filter(
        c => c.dterre === this.territorioSeleccionado
      );
    }

    const municipios = new Set(centrosFiltrados.map(c => c.dmunic));
    this.municipios = Array.from(municipios).sort();
  }

  aplicarFiltros() {
    this.filteredReuniones = this.reunionesList.filter(reunion => {
      if (!reunion.centro) return false;

      let coincide = true;

      if (this.tipoCentroSeleccionado && this.tipoCentroSeleccionado !== 'Todos') {
        coincide = coincide && reunion.centro.dtituc === this.tipoCentroSeleccionado;
      }

      if (this.territorioSeleccionado) {
        coincide = coincide && reunion.centro.dterre === this.territorioSeleccionado;
      }

      if (this.municipioSeleccionado) {
        coincide = coincide && reunion.centro.dmunic === this.municipioSeleccionado;
      }

      return coincide;
    });

    this.p = 1;
  }

  contarReuniones(): number {
    return this.filteredReuniones.length;
  }

  getEstadoClass(estado: string): string {
    const clases: { [key: string]: string } = {
      'Pendiente': 'badge bg-warning text-dark',
      'Aceptada': 'badge bg-success',
      'Cancelada': 'badge bg-danger',
      'Conflicto': 'badge bg-secondary'
    };
    return clases[estado] || 'badge bg-info';
  }
}