import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import type { RefresherCustomEvent } from '@ionic/angular';

import type { Publicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { UiService } from '../../core/ui.service';
import { EsqueletoListadoComponent } from '../../shared/ui/esqueleto-listado.component';
import { EstadoVacioComponent } from '../../shared/ui/estado-vacio.component';
import { PublicacionCardComponent } from '../../shared/ui/publicacion-card.component';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonSearchbar,
    IonRefresher,
    IonRefresherContent,
    PublicacionCardComponent,
    EstadoVacioComponent,
    EsqueletoListadoComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/inicio"></ion-back-button>
        </ion-buttons>
        <ion-title>Servicios y Productos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-searchbar
        [value]="busqueda()"
        placeholder="Buscar servicios o productos"
        (ionInput)="busqueda.set($any($event).detail.value ?? '')"
      ></ion-searchbar>

      <ion-segment class="segmento" [value]="filtro()" (ionChange)="filtro.set($any($event).detail.value)">
        <ion-segment-button value="todos"><ion-label>Todos</ion-label></ion-segment-button>
        <ion-segment-button value="servicio"><ion-label>Servicios</ion-label></ion-segment-button>
        <ion-segment-button value="producto"><ion-label>Productos</ion-label></ion-segment-button>
      </ion-segment>

      @if (pubs.cargando() && lista().length === 0) {
        <app-esqueleto-listado [filas]="3"></app-esqueleto-listado>
      }

      @for (p of lista(); track p.id) {
        <app-publicacion-card [publicacion]="p" [style.--i]="$index" (abrir)="ver($event)"></app-publicacion-card>
      } @empty {
        @if (!pubs.cargando()) {
          <app-estado-vacio
            icono="search-outline"
            titulo="Sin resultados"
            texto="No hay servicios ni productos con ese filtro."
            accionTexto="Ver todo"
            (accion)="limpiar()"
          ></app-estado-vacio>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      .segmento {
        padding: 0 8px 8px;
      }
    `,
  ],
})
export class ServiciosPage {
  readonly pubs = inject(PublicacionesService);
  private ui = inject(UiService);
  private router = inject(Router);

  readonly filtro = signal<'todos' | 'servicio' | 'producto'>('todos');
  readonly busqueda = signal('');

  readonly lista = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.pubs.cercanas().filter((p) => {
      if (!(p.tipo === 'ofrezco' && (p.categoria === 'servicio' || p.categoria === 'producto'))) return false;
      if (this.filtro() !== 'todos' && p.categoria !== this.filtro()) return false;
      if (!texto) return true;
      const contenido =
        `${p.titulo} ${p.descripcion ?? ''} ${p.perfiles?.nombre ?? ''} ${p.perfiles?.barrio ?? ''}`.toLowerCase();
      return contenido.includes(texto);
    });
  });

  async ionViewWillEnter(): Promise<void> {
    this.pubs.suscribir();
    try {
      await this.pubs.cargar();
    } catch {
      await this.ui.aviso('No se pudieron cargar los servicios', 'danger');
    }
  }

  limpiar(): void {
    this.busqueda.set('');
    this.filtro.set('todos');
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    try {
      await this.pubs.cargar();
    } catch {
      await this.ui.aviso('No se pudieron cargar los servicios', 'danger');
    } finally {
      await evento.target.complete();
    }
  }

  ver(p: Publicacion): void {
    void this.router.navigateByUrl(`/publicacion/${p.id}`);
  }
}
