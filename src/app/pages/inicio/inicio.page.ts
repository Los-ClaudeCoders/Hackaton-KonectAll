import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import type { RefresherCustomEvent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  constructOutline,
  ellipsisHorizontal,
  peopleOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';

import { AuthService } from '../../core/auth.service';
import type { Publicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { UiService } from '../../core/ui.service';
import { colorTipo, etiquetaTipo, textoPrecio } from '../../shared/catalogo.util';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonChip,
    IonIcon,
    IonSpinner,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonRefresher,
    IonRefresherContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>KonectAll</ion-title>
        <ion-buttons slot="end">
          @if (!auth.usuario()) {
            <ion-button (click)="ir('/login')">Entrar</ion-button>
          }
          <ion-button (click)="abrirMas()" aria-label="Más secciones">
            <ion-icon slot="icon-only" name="ellipsis-horizontal"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (!enLinea()) {
        <ion-card color="warning">
          <ion-card-content> Sin conexión. Mostrando la última información guardada en el teléfono. </ion-card-content>
        </ion-card>
      }

      @if (emergencias().length > 0) {
        <ion-card button color="danger" (click)="ir('/tabs/emergencia')">
          <ion-card-content>
            <strong>{{ emergencias().length }} ayuda(s) de emergencia activa(s).</strong>
            Toca para ver el modo emergencia.
          </ion-card-content>
        </ion-card>
      }

      <ion-grid class="ion-no-padding">
        <ion-row>
          <ion-col size="6">
            <ion-card button (click)="ir('/tabs/servicios')">
              <ion-card-content>
                <ion-icon name="construct-outline" size="large" color="primary"></ion-icon>
                <h2>Servicios y Productos</h2>
                <p>Oficios y cosas cerca de ti</p>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="6">
            <ion-card button (click)="ir('/tabs/intercambios')">
              <ion-card-content>
                <ion-icon name="swap-horizontal-outline" size="large" color="tertiary"></ion-icon>
                <h2>Intercambios Solidarios</h2>
                <p>Sin dinero, con confianza</p>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="6">
            <ion-card button (click)="ir('/tabs/emergencia')">
              <ion-card-content>
                <ion-icon name="alert-circle-outline" size="large" color="danger"></ion-icon>
                <h2>Emergencias</h2>
                <p>Pide u ofrece ayuda ya</p>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="6">
            <ion-card button (click)="ir('/tabs/comunidad')">
              <ion-card-content>
                <ion-icon name="people-outline" size="large" color="success"></ion-icon>
                <h2>Mi Comunidad</h2>
                <p>Vecinos y recomendaciones</p>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-searchbar
        [value]="busqueda()"
        placeholder="Buscar servicios, productos o vecinos"
        (ionInput)="busqueda.set($any($event).detail.value ?? '')"
      ></ion-searchbar>

      <ion-segment [value]="radio().toString()" (ionChange)="cambiarRadio($any($event).detail.value)">
        <ion-segment-button value="0"><ion-label>Todos</ion-label></ion-segment-button>
        <ion-segment-button value="1"><ion-label>1 km</ion-label></ion-segment-button>
        <ion-segment-button value="3"><ion-label>3 km</ion-label></ion-segment-button>
        <ion-segment-button value="5"><ion-label>5 km</ion-label></ion-segment-button>
      </ion-segment>

      <h2 class="titulo-seccion">Cerca de ti</h2>

      @if (pubs.cargando() && pubs.publicaciones().length === 0) {
        <div class="centrado"><ion-spinner></ion-spinner></div>
      }

      @for (p of resultados().slice(0, 20); track p.id) {
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
            @if (p.urgente || p.modo === 'emergencia') {
              <ion-chip color="danger" outline>Urgente</ion-chip>
            }
          </ion-card-content>
        </ion-card>
      } @empty {
        @if (!pubs.cargando()) {
          <ion-card>
            <ion-card-content>
              @if (busqueda() || radio() > 0) {
                No encontramos publicaciones con ese filtro.
              } @else {
                Aún no hay publicaciones cercanas. ¡Sé el primero en publicar!
              }
            </ion-card-content>
          </ion-card>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      .titulo-seccion {
        margin: 20px 0 8px;
        font-weight: 600;
      }
      .centrado {
        text-align: center;
        padding: 24px;
      }
      ion-card h2 {
        font-size: 1rem;
        font-weight: 600;
        margin: 8px 0 4px;
      }
      ion-card p {
        font-size: 0.85rem;
        color: var(--ion-color-medium);
        margin: 0;
      }
    `,
  ],
})
export class InicioPage {
  readonly auth = inject(AuthService);
  readonly pubs = inject(PublicacionesService);
  private router = inject(Router);
  private sheet = inject(ActionSheetController);
  private ui = inject(UiService);

  readonly colorTipo = colorTipo;
  readonly etiquetaTipo = etiquetaTipo;
  readonly textoPrecio = textoPrecio;

  readonly enLinea = signal(navigator.onLine);
  readonly busqueda = signal('');
  readonly radio = signal(0);

  readonly emergencias = computed(() => this.pubs.cercanas().filter((p) => p.modo === 'emergencia'));

  readonly resultados = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const limite = this.radio();
    return this.pubs.cercanas().filter((p) => {
      if (limite > 0 && (p.distanciaKm ?? Infinity) > limite) return false;
      if (!texto) return true;
      const contenido =
        `${p.titulo} ${p.descripcion ?? ''} ${p.perfiles?.nombre ?? ''} ${p.perfiles?.barrio ?? ''}`.toLowerCase();
      return contenido.includes(texto);
    });
  });

  constructor() {
    addIcons({ constructOutline, swapHorizontalOutline, alertCircleOutline, peopleOutline, ellipsisHorizontal });
    window.addEventListener('online', () => this.enLinea.set(true));
    window.addEventListener('offline', () => this.enLinea.set(false));
  }

  async ionViewWillEnter(): Promise<void> {
    this.pubs.suscribir();
    try {
      await this.pubs.cargar();
    } catch {
      await this.ui.aviso('No se pudieron cargar las publicaciones', 'danger');
    }
  }

  cambiarRadio(valor: string): void {
    this.radio.set(Number(valor) || 0);
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    try {
      await this.pubs.cargar();
    } catch {
      await this.ui.aviso('No se pudieron cargar las publicaciones', 'danger');
    } finally {
      await evento.target.complete();
    }
  }

  async abrirMas(): Promise<void> {
    const sheet = await this.sheet.create({
      header: 'Más secciones',
      buttons: [
        { text: 'Servicios y productos', handler: () => this.ir('/tabs/servicios') },
        { text: 'Intercambios', handler: () => this.ir('/tabs/intercambios') },
        { text: 'Mi comunidad', handler: () => this.ir('/tabs/comunidad') },
        { text: 'Emergencias', handler: () => this.ir('/tabs/emergencia') },
        {
          text: 'Ver tutorial',
          handler: () => void this.router.navigate(['/bienvenida'], { queryParams: { repaso: 1 } }),
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  ir(ruta: string): void {
    void this.router.navigateByUrl(ruta);
  }

  ver(p: Publicacion): void {
    void this.router.navigateByUrl(`/publicacion/${p.id}`);
  }
}
