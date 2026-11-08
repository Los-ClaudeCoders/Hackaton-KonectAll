import type { OnDestroy } from '@angular/core';
import { Component, NgZone, computed, effect, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  bagHandleOutline,
  chevronForwardOutline,
  constructOutline,
  locateOutline,
  person,
  pricetagOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';
import * as L from 'leaflet';

import type { Publicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { UiService } from '../../core/ui.service';
import { textoPrecio, visualPublicacion } from '../../shared/catalogo.util';

type FiltroMapa = 'todos' | 'servicio' | 'intercambio' | 'emergencia';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonFab,
    IonFabButton,
    IonIcon,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mapa cercano</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment scrollable [value]="filtro()" (ionChange)="cambiarFiltro($any($event).detail.value)">
          <ion-segment-button value="todos"><ion-label>Todos</ion-label></ion-segment-button>
          <ion-segment-button value="servicio"><ion-label>Servicios</ion-label></ion-segment-button>
          <ion-segment-button value="intercambio"><ion-label>Intercambios</ion-label></ion-segment-button>
          <ion-segment-button value="emergencia"><ion-label>Emergencias</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content [scrollY]="false">
      <div id="konectall-mapa"></div>

      @if (seleccionada(); as p) {
        <div class="preview" role="button" tabindex="0" (click)="ver(p)" (keyup.enter)="ver(p)">
          <div class="preview-media" [style.background]="visual(p).suave">
            <ion-icon [name]="visual(p).icono" [style.color]="visual(p).color"></ion-icon>
          </div>
          <div class="preview-info">
            <strong>{{ p.titulo }}</strong>
            <span>{{ p.perfiles?.nombre ?? 'Vecino' }} · {{ p.distanciaKm?.toFixed(1) ?? '?' }} km</span>
            <span class="precio">{{ textoPrecio(p.precio) }}</span>
          </div>
          <ion-icon class="chevron" name="chevron-forward-outline"></ion-icon>
        </div>
      } @else {
        <ion-fab vertical="bottom" horizontal="end" slot="fixed">
          <ion-fab-button size="small" aria-label="Centrar en mi ubicación" (click)="centrar()">
            <ion-icon name="locate-outline"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      }
    </ion-content>
  `,
  styles: [
    `
      #konectall-mapa {
        background: var(--app-surface-2);
        height: 100%;
        width: 100%;
      }
      .preview {
        align-items: center;
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        bottom: calc(74px + env(safe-area-inset-bottom));
        box-shadow: var(--app-shadow);
        cursor: pointer;
        display: flex;
        gap: 10px;
        left: 12px;
        padding: 10px;
        position: fixed;
        right: 12px;
        z-index: 1000;
      }
      .preview-media {
        align-items: center;
        border-radius: 12px;
        display: flex;
        flex-shrink: 0;
        font-size: 24px;
        height: 52px;
        justify-content: center;
        width: 52px;
      }
      .preview-info {
        display: flex;
        flex: 1;
        flex-direction: column;
        line-height: 1.3;
        min-width: 0;
      }
      .preview-info strong {
        font-size: 0.9rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .preview-info span {
        color: var(--app-muted);
        font-size: 0.74rem;
      }
      .preview-info .precio {
        color: var(--ion-color-success);
        font-weight: 600;
      }
      .chevron {
        color: var(--app-muted);
        flex-shrink: 0;
      }
    `,
  ],
})
export class MapaPage implements OnDestroy {
  private pub = inject(PublicacionesService);
  private router = inject(Router);
  private ui = inject(UiService);
  private zone = inject(NgZone);

  readonly filtro = signal<FiltroMapa>('todos');
  readonly seleccionada = signal<Publicacion | null>(null);
  readonly textoPrecio = textoPrecio;

  readonly filtrados = computed(() => {
    const lista = this.pub.cercanas();
    switch (this.filtro()) {
      case 'servicio':
        return lista.filter((p) => p.tipo === 'ofrezco' && (p.categoria === 'servicio' || p.categoria === 'producto'));
      case 'intercambio':
        return lista.filter((p) => p.tipo === 'intercambio');
      case 'emergencia':
        return lista.filter((p) => p.modo === 'emergencia' || p.urgente);
      default:
        return lista;
    }
  });

  private mapa?: L.Map;
  private capa = L.layerGroup();
  private yo?: L.Marker;

  constructor() {
    addIcons({
      alertCircleOutline,
      bagHandleOutline,
      chevronForwardOutline,
      constructOutline,
      locateOutline,
      person,
      pricetagOutline,
      swapHorizontalOutline,
    });
    effect(() => {
      this.dibujar(this.filtrados());
    });
  }

  async ionViewWillEnter(): Promise<void> {
    this.seleccionada.set(null);
    this.pub.suscribir();
    try {
      await this.pub.cargar();
      if (this.mapa) {
        this.mapa.invalidateSize();
        this.centrar();
      }
    } catch {
      await this.ui.aviso('No se pudo cargar el mapa', 'danger');
    }
  }

  ionViewDidEnter(): void {
    if (this.mapa) {
      this.mapa.invalidateSize();
      return;
    }
    const pos = this.pub.posicion();
    this.mapa = L.map('konectall-mapa').setView([pos.lat, pos.lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(this.mapa);
    this.capa.addTo(this.mapa);
    this.centrar();
    this.dibujar(this.filtrados());
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
    this.mapa = undefined;
  }

  visual(p: Publicacion): ReturnType<typeof visualPublicacion> {
    return visualPublicacion(p);
  }

  cambiarFiltro(valor: FiltroMapa): void {
    this.filtro.set(valor);
    this.seleccionada.set(null);
  }

  centrar(): void {
    if (!this.mapa) return;
    const pos = this.pub.posicion();
    this.yo?.remove();
    this.yo = L.marker([pos.lat, pos.lng], {
      icon: L.divIcon({
        className: 'pin-mapa pin-mapa-yo',
        html: '<div class="pin-mapa-cuerpo"><ion-icon name="person"></ion-icon></div>',
        iconSize: [38, 46],
        iconAnchor: [19, 46],
      }),
    })
      .bindTooltip('Estás aquí', { direction: 'top', offset: [0, -32] })
      .addTo(this.mapa);
    this.mapa.setView([pos.lat, pos.lng], 15);
  }

  ver(p: Publicacion): void {
    this.zone.run(() => void this.router.navigateByUrl(`/publicacion/${p.id}`));
  }

  private dibujar(lista: Publicacion[]): void {
    if (!this.mapa) return;
    this.capa.clearLayers();
    for (const p of lista) {
      L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: 'pin-mapa',
          html: `<div class="pin-mapa-cuerpo" style="--pin:${this.color(p)}"><ion-icon name="${this.visual(p).icono}"></ion-icon></div>`,
          iconSize: [34, 42],
          iconAnchor: [17, 41],
        }),
      })
        .bindTooltip(p.direccion ? `${p.titulo} · ${p.direccion}` : p.titulo, {
          direction: 'top',
          offset: [0, -32],
        })
        .on('click', () => this.zone.run(() => this.seleccionada.set(p)))
        .addTo(this.capa);
    }
  }

  private color(p: Publicacion): string {
    if (p.modo === 'emergencia' || p.urgente) return '#dc2626';
    if (p.tipo === 'intercambio') return '#0d9488';
    if (p.tipo === 'necesito') return '#c2410c';
    return '#1c5fd6';
  }
}
