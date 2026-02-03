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
  // Paginación 
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

  // Nuevas propiedades para el formulario de creación de reunión
  mostrarFormulario: boolean = false;
  nuevaReunion = {
    titulo: '',
    tema: '',
    fecha: '',
    hora: '',
    aula: '',
    estado: 'Pendiente' as 'Pendiente' | 'Aceptada' | 'Cancelada' | 'Conflicto',
    centroId: 1,
    profesorId: 0,
    alumnoId: 0
  };

  profesores: any[] = [];
  alumnos: any[] = [];
  esProfesor: boolean = false;

  // Fechas mínimas/máximas
  fechaMinima = '';
  fechaMaxima = '';



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

  constructor(private reunionesService: reuniones, private AuthService: AuthService) {
    this.configurarFechas();
    this.verificarPermisos();
  }

  async ngOnInit() {
    await this.cargarDatos();
    await this.cargarUsuarios();
  }

  verificarPermisos() {
    // Aquí deberíamos verificar si el usuario es profesor 
    // Por ahora lo dejamos en true para pruebas
    this.esProfesor = true; //TODO: Implementar verificación solo si es profesor
  }

  configurarFechas() {
    const hoy = new Date();
    this.fechaMinima = hoy.toISOString().split('T')[0];
    
    const finCurso = new Date('2025-05-31');
    this.fechaMaxima = finCurso.toISOString().split('T')[0];
  }

  /**
   * Cargar profesores y alumnos desde el backend, y establecer el profesor actual. Funciona para el formulario de creación de reuniones.
   */
async cargarUsuarios() {
  console.log('🔄 Cargando profesores y alumnos desde backend...');
  
  try {
    // Cargar profesores
    this.profesores = await this.reunionesService.getProfesores();
    console.log(' Profesores cargados:', this.profesores.length);
    
    // Cargar alumnos  
    this.alumnos = await this.reunionesService.getAlumnos();
    console.log(' Alumnos cargados:', this.alumnos.length);

    // Establecer profesor actual
    const usuarioActual = this.AuthService.getLoggedUser();
    if (usuarioActual && usuarioActual.id) {
      this.nuevaReunion.profesorId = usuarioActual.id;
      console.log(' Profesor actual establecido:', usuarioActual.id);
    } else {
      // Si no hay usuario logueado, usar el primer profesor de la lista
      if (this.profesores.length > 0) {
        this.nuevaReunion.profesorId = this.profesores[0].id;
      }
    }

  } catch (error) {
    console.error(' Error cargando usuarios:', error);
    alert('⚠️ Error al cargar profesores y alumnos. Verifica que el servidor esté ejecutándose en el puerto 3000.');
  }
}

  // Abrir formulario
  abrirFormulario() {
    if (!this.esProfesor) {
      alert('Solo los profesores pueden crear reuniones');
      return;
    }
    this.mostrarFormulario = true;
    this.resetFormulario();
  }

  // Cerrar formulario
  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.resetFormulario();
  }

  // Reset formulario
  resetFormulario() {
    this.nuevaReunion = {
      titulo: '',
      tema: '',
      fecha: '',
      hora: '',
      aula: '',
      estado: 'Pendiente',
      centroId: 1,
      profesorId: 0,
      alumnoId: 0
    };
  }

  // Guardar reunión
async guardarReunion() {
  console.log(' Intentando guardar reunión:', this.nuevaReunion);

  if (!this.validarFormulario()) {
    return;
  }

  try {
    // Asegurar que profesorId está establecido
    if (!this.nuevaReunion.profesorId || this.nuevaReunion.profesorId === 0) {
      const usuarioActual = this.AuthService.user;
      if (usuarioActual && usuarioActual.id) {
        this.nuevaReunion.profesorId = usuarioActual.id;
      } else if (this.profesores.length > 0) {
        this.nuevaReunion.profesorId = this.profesores[0].id;
      } else {
        alert(' Error: No se pudo determinar el profesor');
        return;
      }
    }

    //  Crear objeto con la estructura exacta que espera el backend
    const reunionData = {
      titulo: this.nuevaReunion.titulo,
      tema: this.nuevaReunion.tema,
      fecha: this.nuevaReunion.fecha,
      hora: this.nuevaReunion.hora,
      aula: this.nuevaReunion.aula,
      estado: this.nuevaReunion.estado || 'pendiente',
      centroId: this.nuevaReunion.centroId || 15112,
      profesorId: this.nuevaReunion.profesorId,
      alumnoId: this.nuevaReunion.alumnoId
    };

    console.log(' Enviando al servidor:', reunionData);

    await this.reunionesService.createReunion(reunionData);
    
    alert(' Reunión creada correctamente');
    console.log(' Reunión guardada');
    this.cerrarFormulario();
    await this.cargarDatos(); // Recargar lista
    
  } catch (error: any) {
    console.error(' Error creando reunión:', error);
    
    // Mostrar mensaje más detallado
    let mensaje = ' Error al crear la reunión';
    if (error?.error?.error) {
      mensaje += ': ' + error.error.error;
    }
    if (error?.error?.campos_requeridos) {
      mensaje += '\nCampos requeridos: ' + error.error.campos_requeridos.join(', ');
    }
    
    alert(mensaje);
  }
}

/**
 * Validar formulario antes de enviar, mostrando alertas si hay errores.
 */
  validarFormulario(): boolean {
    if (!this.nuevaReunion.titulo.trim()) {
      alert('El título es obligatorio');
      return false;
    }
    if (!this.nuevaReunion.tema.trim()) {
      alert('El tema es obligatorio');
      return false;
    }
    if (!this.nuevaReunion.fecha) {
      alert('La fecha es obligatoria');
      return false;
    }
    if (!this.nuevaReunion.hora) {
      alert('La hora es obligatoria');
      return false;
    }
    if (!this.nuevaReunion.aula.trim()) {
      alert('El aula es obligatoria');
      return false;
    }
    if (!this.nuevaReunion.alumnoId || this.nuevaReunion.alumnoId === 0) {
      alert('Debes seleccionar un alumno');
      return false;
    }
    return true;
  }

  /**
   * Cargar datos iniciales: centros y reuniones, y preparar filtros.
   */
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
      
      // Asociar centros a reuniones
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

  // Eventos de cambio en filtros
  onTipoCentroChange() {
    this.territorioSeleccionado = '';
    this.municipioSeleccionado = '';
    this.actualizarTerritorios();
    this.aplicarFiltros();
  }

  // Evento al cambiar territorio
  onTerritorioChange() {
    this.municipioSeleccionado = '';
    this.actualizarMunicipios();
    this.aplicarFiltros();
  }

  // Evento al cambiar municipio
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

  /**
   * Obtener la clase CSS correspondiente al estado de una reunión. 
   */
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