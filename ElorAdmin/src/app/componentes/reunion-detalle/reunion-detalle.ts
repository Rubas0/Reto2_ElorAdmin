import { Component, OnInit, AfterViewChecked, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReunionesService } from '../../servicios/ReunionesService';
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
export class ReunionDetalle implements OnInit, AfterViewChecked, OnDestroy {
  private readonly reunionesService = inject(ReunionesService);
  private readonly route = inject(ActivatedRoute);

  reunion: Reunion | null = null;
  centro: Centro | null = null;

  loading = true;
  error = '';

  // Referencia REAL al div del mapa cuando el *ngIf lo pinta
  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;

  private map?: mapboxgl.Map;
  private mapInicializado = false;

  private readonly MAPBOX_TOKEN =
    'pk.eyJ1IjoiaW92aWVkbyIsImEiOiJjbWo0ZDl5aGQwMDR2MmtzN3R4azRlZXRjIn0.4KYxMpPfQ7vZHh0Ix5eEaA';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'ID de reunión no válido';
      this.loading = false;
      return;
    }
    this.cargarReunion(id);
  }

  /**
   * AfterViewChecked se ejecuta cuando Angular termina de pintar la vista.
   * Es la forma más simple de asegurarnos de que el div del mapa existe.
   */
  ngAfterViewChecked(): void {
    // Solo inicializar cuando:
    // - ya tenemos centro
    // - el contenedor del mapa existe
    // - y todavía no hemos creado el mapa
    if (!this.mapInicializado && this.centro && this.mapContainer?.nativeElement) {
      this.inicializarMapaSimple();
    }
  }

  private async cargarReunion(id: number): Promise<void> {
    try {
      this.loading = true;

      this.reunion = await this.reunionesService.getReunionById(id);
      if (!this.reunion) {
        this.error = 'Reunión no encontrada';
        this.loading = false;
        return;
      }

      await this.cargarCentro(this.reunion.centroId);

      this.loading = false;
      // Nota: el mapa NO se inicializa aquí a la fuerza.
      // Lo hará ngAfterViewChecked cuando el *ngIf ya haya dibujado el contenedor.
    } catch (e) {
      console.error('Error cargando reunión:', e);
      this.error = 'Error al cargar la información de la reunión';
      this.loading = false;
    }
  }

  private async cargarCentro(centroId: number): Promise<void> {
    try {
      const centros = await this.reunionesService.getAllCentros();
      const ref = String(centroId);

      this.centro =
        centros.find((c: Centro) => String(c.codigo) === ref) ||
        centros[0] || {
          codigo: '15112',
          nombre: 'CIFP Elorrieta-Errekamari LHII',
          dtituc: 'Departamento de Educación',
          dterre: 'Bizkaia',
          dmunic: 'Bilbao',
          lat: 43.2627,
          lon: -2.9253,
          direccion: 'San Adrián, 3'
        };
    } catch (e) {
      console.error('Error cargando centro:', e);
      // Fallback
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

  /**
   * Inicialización SIMPLE del mapa (para probarlo).
   * Si esto funciona, luego añadimos el marcador.
   */
  private inicializarMapaSimple(): void {
    if (!this.centro || !this.mapContainer?.nativeElement) return;

    const lon = Number(this.centro.lon);
    const lat = Number(this.centro.lat);

    if (Number.isNaN(lon) || Number.isNaN(lat)) {
      this.error = 'Coordenadas del centro no válidas';
      return;
    }

    try {
      this.mapInicializado = true;
      (mapboxgl as any).accessToken = this.MAPBOX_TOKEN;

      this.map = new mapboxgl.Map({
        container: this.mapContainer.nativeElement, // <- no id, el elemento real
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lon, lat], // orden correcto [lon, lat]
        zoom: 14
      });

      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Marcador opcional (cuando el mapa funcione, descomenta para rúbrica)
      this.map.on('load', () => {
        new mapboxgl.Marker({ color: '#0066cc' })
          .setLngLat([lon, lat])
          // .addTo(this.map);
      });
    } catch (e) {
      console.error('Error inicializando mapa:', e);
      this.error = 'Error al cargar el mapa';
    }
  }


ngOnDestroy(): void { // Limpiar mapa al destruir el componente, si existe
  if (this.map) {
    this.map.remove();
  }
}

  getEstadoClass(estado: string): string {
    const clases: Record<string, string> = {
      Pendiente: 'badge bg-warning text-dark',
      Aceptada: 'badge bg-success',
      Cancelada: 'badge bg-danger',
      Conflicto: 'badge bg-secondary'
    };
    return clases[estado] || 'badge bg-info';
  }
}