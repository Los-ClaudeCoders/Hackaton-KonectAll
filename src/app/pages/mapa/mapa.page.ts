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
import { locateOutline } from 'ionicons/icons';
import * as L from 'leaflet';

import type { Publicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { UiService } from '../../core/ui.service';

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
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button size="small" aria-label="Centrar en mi ubicación" (click)="centrar()">
          <ion-icon name="locate-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [
    `
      #konectall-mapa {
        height: 100%;
        width: 100%;
        background: #e5e7eb;
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
  private yo?: L.CircleMarker;

  constructor() {
    addIcons({ locateOutline });
    effect(() => {
      this.dibujar(this.filtrados());
    });
  }

  async ionViewWillEnter(): Promise<void> {
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

  cambiarFiltro(valor: FiltroMapa): void {
    this.filtro.set(valor);
  }

  centrar(): void {
    if (!this.mapa) return;
    const pos = this.pub.posicion();
    this.yo?.remove();
    this.yo = L.circleMarker([pos.lat, pos.lng], {
      radius: 7,
      color: '#ffffff',
      weight: 3,
      fillColor: '#3880ff',
      fillOpacity: 1,
    })
      .bindTooltip('Estás aquí', { direction: 'top' })
      .addTo(this.mapa);
    this.mapa.setView([pos.lat, pos.lng], 15);
  }

  private dibujar(lista: Publicacion[]): void {
    if (!this.mapa) return;
    this.capa.clearLayers();
    for (const p of lista) {
      L.circleMarker([p.lat, p.lng], {
        radius: 10,
        color: '#ffffff',
        weight: 2,
        fillColor: this.color(p),
        fillOpacity: 1,
      })
        .bindTooltip(p.direccion ? `${p.titulo} · ${p.direccion}` : p.titulo, {
          direction: 'top',
          offset: [0, -8],
        })
        .on('click', () => this.ver(p))
        .addTo(this.capa);
    }
  }

  private color(p: Publicacion): string {
    if (p.modo === 'emergencia' || p.urgente) return '#d3392f';
    if (p.tipo === 'ofrezco') return '#2dd36f';
    if (p.tipo === 'intercambio') return '#6a64ff';
    return '#ffc409';
  }

  private ver(p: Publicacion): void {
    this.zone.run(() => void this.router.navigateByUrl(`/publicacion/${p.id}`));
  }
}
