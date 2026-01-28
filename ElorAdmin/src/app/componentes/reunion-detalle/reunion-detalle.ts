import { Component, OnInit, inject, AfterViewInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { reuniones } from '../../servicios/reuniones';
import mapboxgl from 'mapbox-gl';

@Component({
  selector: 'app-reunion-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reunion-detalle.html',
  styleUrls: ['./reunion-detalle.css']
})
export class ReunionDetalle implements OnInit, AfterViewInit {
  reuniones = inject(reuniones);
  route = inject(ActivatedRoute);

  reunion: any = null;
  centro: any = null;
  map!: mapboxgl.Map;
  mapLoaded = false;

  // Configurar el token ANTES del constructor para que mapbox lo use
  private readonly MAPBOX_TOKEN = 'pk.eyJ1IjoiaW92aWVkbyIsImEiOiJjbWo0ZDl5aGQwMDR2MmtzN3R4azRlZXRjIn0.4KYxMpPfQ7vZHh0Ix5eEaA';

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarReunion(id);
  }

  ngAfterViewInit() {
    // Asegurar que el mapa se inicializa después de la vista
    if (this.mapLoaded && this.centro) {
      this.inicializarMapa();
    }
  }

  async cargarReunion(id: number) {
    try {
      this.reunion = await this.reuniones.getReunionById(id);
      // this.centro = await this.reuniones.getCentroById(this.reunion.centroId);
      
      this.mapLoaded = true;
      
      // Esperar un tick para asegurar que el DOM está listo
      setTimeout(() => this.inicializarMapa(), 100);
    } catch (error) {
      console.error('Error cargando reunión:', error);
    }
  }

  inicializarMapa() {
    if (!this.centro || !document.getElementById('mapa')) {
      console.error('No se puede inicializar el mapa: falta el centro o el contenedor');
      return;
    }

    try {
      // Configurar el token de Mapbox correctamente
      Object.defineProperty(mapboxgl, 'accessToken', {
        value: this.MAPBOX_TOKEN,
        writable: false
      });

      this.map = new mapboxgl.Map({
        container: 'mapa',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [this.centro.longitud, this.centro.latitud],
        zoom: 15
      });

      // Agregar controles de navegación
      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Crear el marcador
      const marker = new mapboxgl.Marker({ 
        color: '#0066cc',
        scale: 1.2
      })
        .setLngLat([this.centro.longitud, this.centro.latitud])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 10px;">
              <h6 style="margin: 0 0 8px 0; color: #0066cc;">
                <i class="bi bi-building"></i> ${this.centro.nombre}
              </h6>
              <p style="margin: 0; font-size: 0.9rem;">
                <i class="bi bi-geo-alt"></i> ${this.centro.direccion}
              </p>
              <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: #666;">
                ${this.centro.DMUNIC}, ${this.centro.DTERRE}
              </p>
            </div>
          `)
        )
        .addTo(this.map);

      // Abrir el popup automáticamente
      marker.togglePopup();

    } catch (error) {
      console.error('Error inicializando el mapa:', error);
    }
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
    }
  }
}