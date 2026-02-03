import { Component, OnInit, inject, AfterViewInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { reuniones } from '../../servicios/reuniones';
import mapboxgl from 'mapbox-gl';

interface Centro {
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
}

@Component({
  selector: 'app-reunion-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reunion-detalle.html',
  styleUrls: ['./reunion-detalle.css']
})
export class ReunionDetalle implements OnInit, AfterViewInit {
  reunionesService = inject(reuniones);
  route = inject(ActivatedRoute);

  reunion: Reunion | null = null;
  centro: Centro | null = null;
  map!: mapboxgl.Map;
  mapLoaded = false;
  loading = true;
  error = '';

  // Token de Mapbox
  private readonly MAPBOX_TOKEN = 'pk.eyJ1IjoiaW92aWVkbyIsImEiOiJjbWo0ZDl5aGQwMDR2MmtzN3R4azRlZXRjIn0.4KYxMpPfQ7vZHh0Ix5eEaA';

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.cargarReunion(id);
    } else {
      this.error = 'ID de reunión no válido';
      this.loading = false;
    }
  }

  ngAfterViewInit() {
    // El mapa se inicializará después de cargar los datos
  }

  async cargarReunion(id: number) {
    try {
      this.loading = true;
      
      // Cargar reunión desde json-server
      this.reunion = await this.reunionesService.getReunionById(id);
      
      if (!this.reunion) {
        this.error = 'Reunión no encontrada';
        this.loading = false;
        return;
      }

      // Cargar centro desde EuskadiLatLon.json
      await this.cargarCentro(this.reunion.centroId);
      
      this.loading = false;
      this.mapLoaded = true;
      
      // Esperar un tick para asegurar que el DOM está listo
      setTimeout(() => this.inicializarMapa(), 100);
      
    } catch (error) {
      console.error('Error cargando reunión:', error);
      this.error = 'Error al cargar la información de la reunión';
      this.loading = false;
    }
  }

  async cargarCentro(centroId: number) {
    try {
      // Cargar centros desde EuskadiLatLon.json
      const response = await fetch('assets/data/EuskadiLatLon.json');
      const centros: Centro[] = await response.json();
      
      // Buscar el centro por código
      // Nota: Usamos nuestro centro por defecto
      this.centro = centros[0] || {
        codigo: '15112',
        nombre: 'CIFP Elorrieta-Errekamari LHII',
        dtituc: 'Departamento de Educación',
        dterre: 'Bizkaia',
        dmunic: 'Bilbao',
        lat: 43.2627,
        lon: -2.9253,
        direccion: 'San Adrián, 3'
      };
      
      console.log(' Centro cargado:', this.centro.nombre);
      
    } catch (error) {
      console.error('Error cargando centro:', error);
      // Centro por defecto: Elorrieta
      this.centro = {
        codigo: '15112',
        nombre: 'CIFP Elorrieta-Errekamari LHII',
        dtituc: 'Departamento de Educación',
        dterre: 'Bizkaia',
        dmunic: 'Bilbao',
        lat: 43.2627,
        lon: -2.9253,
        direccion: 'San Adrián, 3'
      };
    }
  }

  inicializarMapa() {
    if (!this.centro) {
      console.error('No se puede inicializar el mapa: falta el centro');
      return;
    }

    const contenedor = document.getElementById('mapa-reunion');
    if (!contenedor) {
      console.error('No se puede inicializar el mapa: falta el contenedor');
      return;
    }

    try {
      // Configurar el token de Mapbox correctamente
      Object.defineProperty(mapboxgl, 'accessToken', {
        value: this.MAPBOX_TOKEN,
        writable: false
      });

      console.log('Inicializando mapa en:', this.centro.nombre);

      this.map = new mapboxgl.Map({
        container: 'mapa-reunion',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [this.centro.lon, this.centro.lat],
        zoom: 15
      });

      // Agregar controles de navegación
      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Evento cuando el mapa carga
      this.map.on('load', () => {
        console.log(' Mapa cargado correctamente');
        this.agregarMarcador();
      });

    } catch (error) {
      console.error(' Error inicializando el mapa:', error);
      this.error = 'Error al cargar el mapa';
    }
  }

  agregarMarcador() {
    if (!this.centro || !this.map) return;

    // Crear el marcador con popup
    const marker = new mapboxgl.Marker({ 
      color: '#0066cc',
      scale: 1.2
    })
      .setLngLat([this.centro.lon, this.centro.lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 12px; font-family: Arial, sans-serif;">
            <h6 style="margin: 0 0 8px 0; color: #0066cc; font-size: 14px; font-weight: bold;">
               ${this.centro.nombre}
            </h6>
            <p style="margin: 4px 0; font-size: 12px; color: #555;">
               ${this.centro.direccion || 'Sin dirección'}
            </p>
            <p style="margin: 4px 0; font-size: 12px; color: #555;">
               ${this.centro.dmunic}, ${this.centro.dterre}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">
               ${this.centro.lat.toFixed(4)}, ${this.centro.lon.toFixed(4)}
            </p>
          </div>
        `)
      )
      .addTo(this.map);

    // Abrir el popup automáticamente
    marker.togglePopup();

    console.log(' Marcador añadido correctamente');
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

  ngOnDestroy() {
    // Limpiar el mapa al destruir el componente
    if (this.map) {
      this.map.remove();
      console.log(' Mapa eliminado');
    }
  }
}