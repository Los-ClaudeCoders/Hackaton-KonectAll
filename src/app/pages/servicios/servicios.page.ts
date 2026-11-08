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
import { EstadoVacioComponent } from '../../shared/estado-vacio/estado-vacio.component';
import { SkeletonTarjetasComponent } from '../../shared/skeleton-tarjetas/skeleton-tarjetas.component';
import { TarjetaPublicacionComponent } from '../../shared/tarjeta-publicacion/tarjeta-publicacion.component';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [
    TarjetaPublicacionComponent,
    SkeletonTarjetasComponent,
    EstadoVacioComponent,
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
        <app-skeleton-tarjetas></app-skeleton-tarjetas>
      }

      @for (p of lista(); track p.id) {
        <app-tarjeta-publicacion [publicacion]="p" (abrir)="ver($event)"></app-tarjeta-publicacion>
      } @empty {
        @if (!pubs.cargando()) {
          <app-estado-vacio
            icono="construct-outline"
            titulo="No hay servicios ni productos aquí"
            detalle="Prueba otro filtro o publica el primero."
            accion="Publicar"
            (accionPulsada)="publicar()"
          ></app-estado-vacio>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      .segmento {
        padding: 8px;
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

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    try {
      await this.pubs.cargar();
    } catch {
      await this.ui.aviso('No se pudieron cargar los servicios', 'danger');
    } finally {
      await evento.target.complete();
    }
  }

  publicar(): void {
    void this.router.navigateByUrl('/tabs/publicar');
  }

  ver(p: Publicacion): void {
    void this.router.navigateByUrl(`/publicacion/${p.id}`);
  }
}
