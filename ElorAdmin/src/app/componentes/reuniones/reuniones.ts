import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../servicios/usuario';
import { AuthService } from '../../servicios/auth';
import { NgxPaginationModule } from 'ngx-pagination';
import { ReunionesService } from '../../servicios/ReunionesService';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
 

interface Centro {
  id?: number;
  CCEN: number;          
  NOM: string;            
  NOME?: string;        
  DTITUC: string;      
  DTITUE?: string;     
  DTERRC: string;         
  DTERRE?: string;      
  DMUNIC: string;   
  DMUNIE?: string;        
  LATITUD: number;       
  LONGITUD: number;       
  DOMI?: string;   
  
   // Campos normalizados para facilitar el filtrado y la visualización
  codigo?: string;
  nombre?: string;
  dtituc?: string;
  dterre?: string;
  dmunic?: string;
  lat?: number;
  lon?: number;
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

  // Parte de idiomas con i18n simple, texto en objetos
   idioma: 'es'|'eu'|'en' = 'es'; // Idioma actual

 textos = {
    es: {
      gestion: 'Gestión de Reuniones',
      filtros: 'Filtros de Centros',
      nueva: 'Nueva Reunión',
      tipoCentro: 'Tipo de Centro',
      territorio: 'Territorio',
      municipio: 'Municipio',
      total: 'Total reuniones filtradas',
      tabla: 'Listado de Reuniones',
      titulo: 'Título',
      tema: 'Tema',
      fecha: 'Fecha',
      hora: 'Hora',
      aula: 'Aula',
      centro: 'Centro',
      estado: 'Estado',
      acciones: 'Acciones',
      mapa: 'Ver Mapa',
      anterior: 'Anterior',
      siguiente: 'Siguiente',
      noReuniones: 'No hay reuniones para mostrar.'
    },
    eu: {
      gestion: 'Bilerak Kudeatzea',
      filtros: 'Zentroen iragazkiak',
      nueva: 'Bileria berria',
      tipoCentro: 'Zentro mota',
      territorio: 'Lurraldea',
      municipio: 'Udalerria',
      total: 'Iragazitako bilerak guztira',
      tabla: 'Bilerak zerrenda',
      titulo: 'Izenburua',
      tema: 'Gaia',
      fecha: 'Data',
      hora: 'Ordua',
      aula: 'Gela',
      centro: 'Zentroa',
      estado: 'Egoera',
      acciones: 'Ekintzak',
      mapa: 'Mapa ikusi',
      anterior: 'Aurrekoa',
      siguiente: 'Hurrengoa',
      noReuniones: 'Ez dago bilerarik erakusteko.'
    },
    en: {
      gestion: 'Meeting Management',
      filtros: 'Center Filters',
      nueva: 'New Meeting',
      tipoCentro: 'Center Type',
      territorio: 'Territory',
      municipio: 'Municipality',
      total: 'Total filtered meetings',
      tabla: 'Meetings List',
      titulo: 'Title',
      tema: 'Topic',
      fecha: 'Date',
      hora: 'Time',
      aula: 'Room',
      centro: 'Center',
      estado: 'Status',
      acciones: 'Actions',
      mapa: 'View Map',
      anterior: 'Previous',
      siguiente: 'Next',
      noReuniones: 'No meetings to display.'
    }
  };

  cambiarIdioma(id: 'es'|'en'|'eu') {
    this.idioma = id;
  }


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

    // PRUEBA SIMPLE DE CARGA SIN FILTRADO
  centrosPrueba: any[] = [];
  loadingCentrosPrueba = false;
  errorCentrosPrueba = '';

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

  constructor(private reunionesService: ReunionesService, private AuthService: AuthService, private route: ActivatedRoute) {
    this.configurarFechas();
    this.verificarPermisos();
  }

  async ngOnInit() {
    this.verificarPermisos();
    await this.cargarDatos();
    await this.cargarUsuarios();
    // Abrir el formulario si viene ?crear=1
    const crear = this.route.snapshot.queryParamMap.get('crear'); // '1' para abrir el formulario automáticamente
    if (crear === '1') this.abrirFormulario();
  }

  verificarPermisos() {
    // Aquí deberíamos verificar si el usuario es profesor 
    // Por ahora lo dejamos en true para pruebas
     const u = this.AuthService.user || this.AuthService.getLoggedUser?.();
    this.esProfesor = !!u && (u.rol?.toLowerCase?.() === 'profesor' || u.tipo_id === 3 || true);
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
  console.log(' Cargando profesores y alumnos desde backend...');
  
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
    alert(' Error al cargar profesores y alumnos. Verifica que el servidor esté ejecutándose en el puerto 3000.');
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
      const response = await fetch('http://localhost:3001/CENTROS');
      this.centrosList = await response.json();

      const centrosData = await response.json();
      
      // Normalizar territorios a la estructura del JSON a nuestro formato 
    this.centrosList = centrosData.map((c: any, index: number) => {
      const centroNormalizado = {
        ...c,
        id: c.id || c.CCEN || index + 1,
        codigo: String(c.CCEN),           // ✅ CCEN es el código
        nombre: c.NOM || c.NOME || 'Sin nombre',
        dtituc: (c.DTITUC || '').trim() || 'Sin categoría',
        dterre: this.normalizarTerritorio(c.DTERRC || c.DTERRE || ''),
        dmunic: (c.DMUNIC || '').trim() || 'Sin municipio',
        lat: c.LATITUD,
        lon: c.LONGITUD,
        direccion: c.DOMI || 'Sin dirección'
      };
      return centroNormalizado;
    });

      // Cargar reuniones desde json-server
      this.reunionesList = await this.reunionesService.getAllReuniones();
      
      // Asociar centros a reuniones
     this.reunionesList = this.reunionesList.map(r => ({
        ...r,
        centro: this.findCentroByRef(r.centroId) // Buscar centro por código o id
      }));

      this.filteredReuniones = [...this.reunionesList];
      
      // Inicializar filtros para la UI, tanto tipos de centro como territorios y municipios
      this.tiposCentro = this.getTiposCentroUnicos();
      this.territorios = this.getTerritoriosUnicos();
      this.municipios = this.getMunicipiosGlobales();
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

    // Buscar centro por codigo o id, método privado para uso interno
  private findCentroByRef(ref: string | number): Centro | undefined {
    const refStr = String(ref);
    return (
      this.centrosList.find(c => String(c.codigo) === refStr) ||
      this.centrosList.find(c => String(c.id) === refStr)
    );
  }

 normalizarTerritorio(territorio: string): string {
  // Protección contra undefined, null o valores vacíos, efectivo para evitar errores y asegurar consistencia
  if (!territorio) return 'Sin territorio';
  
  const key = territorio.trim().toLowerCase();
  return this.MAPA_TERRITORIOS[key] || territorio.trim();
}

// Obtener listas únicas para filtros, con limpieza de datos y orden alfabético
getTiposCentroUnicos(): string[] {
  const tipos = new Set(
    this.centrosList
      .map(c => c.dtituc)
      .filter((t): t is string => !!t) //  Filtrar undefined
  );
  return Array.from(tipos).sort();
}

getTerritoriosUnicos(): string[] {
  const set = new Set(
    this.centrosList
      .map(c => c.dterre)
      .filter((t): t is string => !!t) // Filtrar undefined
  );
  return Array.from(set).sort();
}

getMunicipiosGlobales(): string[] {
  const set = new Set(
    this.centrosList
      .map(c => c.dmunic)
      .filter((m): m is string => !!m) // Filtrar undefined
  );
  return Array.from(set).sort();
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

  // Actualizar lista de territorios disponibles según el tipo de centro seleccionado
actualizarTerritorios() {
  if (!this.tipoCentroSeleccionado) {
    this.territorios = this.getTerritoriosUnicos();
  } else {
    const centrosFiltrados = this.centrosList.filter(
      c => c.dtituc === this.tipoCentroSeleccionado
    );
    const territorios = new Set(
      centrosFiltrados
        .map(c => c.dterre)
        .filter((t): t is string => !!t) // Filtrar undefined y hacer type guard,  !!t: Convierte el valor a booleano. Si es undefined, null o '', devuelve false.

    );
    this.territorios = Array.from(territorios).sort();
  }
  console.log(' Territorios actualizados:', this.territorios);
}

// Actualizar lista de municipios disponibles según el territorio seleccionado
actualizarMunicipios() {
  let centrosFiltrados = this.centrosList;

  if (this.tipoCentroSeleccionado) {
    centrosFiltrados = centrosFiltrados.filter(
      c => c.dtituc === this.tipoCentroSeleccionado
    );
  }

  if (this.territorioSeleccionado) {
    centrosFiltrados = centrosFiltrados.filter(
      c => c.dterre === this.territorioSeleccionado
    );
  }

  // Obtener municipios únicos del conjunto filtrado
  const municipios = new Set(
    centrosFiltrados
      .map(c => c.dmunic) // Obtener municipio con map y luego filtrar undefined
      .filter((m): m is string => !!m) // Type guard que elimina undefined
  );
  this.municipios = Array.from(municipios).sort();
  console.log(' Municipios actualizados:', this.municipios.length);
}

// Aplicar filtros a la lista de reuniones, actualizando filteredReuniones
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

  cerrarSesion() {
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    this.AuthService.logout(); // Cerrar sesión
  }
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