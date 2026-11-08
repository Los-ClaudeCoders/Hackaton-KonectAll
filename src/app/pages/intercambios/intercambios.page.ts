import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import type { RefresherCustomEvent } from '@ionic/angular';

import type { Publicacion, TipoPublicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { UiService } from '../../core/ui.service';
import { colorTipo, etiquetaTipo, textoPrecio } from '../../shared/catalogo.util';

@Component({
  selector: 'app-intercambios',
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
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonChip,
    IonSpinner,
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
        <ion-title>Intercambios solidarios</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-searchbar
        [value]="busqueda()"
        placeholder="Buscar intercambios"
        (ionInput)="busqueda.set($any($event).detail.value ?? '')"
      ></ion-searchbar>

      <ion-segment class="segmento" [value]="filtro()" (ionChange)="filtro.set($any($event).detail.value)">
        <ion-segment-button value="ofrezco"><ion-label>Ofrezco</ion-label></ion-segment-button>
        <ion-segment-button value="necesito"><ion-label>Necesito</ion-label></ion-segment-button>
        <ion-segment-button value="intercambio">
          <ion-label>Intercambio</ion-label>
        </ion-segment-button>
      </ion-segment>

      @if (pubs.cargando() && lista().length === 0) {
        <div class="centrado"><ion-spinner></ion-spinner></div>
      }

      @for (p of lista(); track p.id) {
        <ion-card button (click)="ver(p)">
          <ion-card-header>
            <ion-card-subtitle>
              {{ p.perfiles?.nombre ?? 'Vecino' }} · {{ p.distanciaKm?.toFixed(1) ?? '?' }} km
            </ion-card-subtitle>
            <ion-card-title>{{ p.titulo }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-chip [color]="colorTipo(p.tipo)" outline>{{ etiquetaTipo(p.tipo) }}</ion-chip>
            <ion-chip color="medium" outline>{{ textoPrecio(p.precio) }}</ion-chip>
          </ion-card-content>
        </ion-card>
      } @empty {
        @if (!pubs.cargando()) {
          <p class="vacio">No hay intercambios en este filtro.</p>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      .segmento {
        padding: 8px;
      }
      .centrado {
        text-align: center;
        padding: 24px;
      }
      .vacio {
        text-align: center;
        color: var(--ion-color-medium);
        padding: 24px;
      }
    `,
  ],
})
export class IntercambiosPage {
  readonly pubs = inject(PublicacionesService);
  private ui = inject(UiService);
  private router = inject(Router);

  readonly colorTipo = colorTipo;
  readonly etiquetaTipo = etiquetaTipo;
  readonly textoPrecio = textoPrecio;

  readonly filtro = signal<TipoPublicacion>('intercambio');
  readonly busqueda = signal('');

  readonly lista = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.pubs.cercanas().filter((p) => {
      if (p.modo !== 'normal' || p.tipo !== this.filtro()) return false;
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
      await this.ui.aviso('No se pudieron cargar los intercambios', 'danger');
    }
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    try {
      await this.pubs.cargar();
    } catch {
      await this.ui.aviso('No se pudieron cargar los intercambios', 'danger');
    } finally {
      await evento.target.complete();
    }
  }

  ver(p: Publicacion): void {
    void this.router.navigateByUrl(`/publicacion/${p.id}`);
  }
}
