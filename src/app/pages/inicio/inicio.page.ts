import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
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
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import type { RefresherCustomEvent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  constructOutline,
  contrastOutline,
  ellipsisHorizontal,
  moonOutline,
  peopleOutline,
  sunnyOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';

import { AuthService } from '../../core/auth.service';
import type { Publicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { TemaService } from '../../core/tema.service';
import { UiService } from '../../core/ui.service';
import { EsqueletoListadoComponent } from '../../shared/ui/esqueleto-listado.component';
import { EstadoVacioComponent } from '../../shared/ui/estado-vacio.component';
import { PublicacionCardComponent } from '../../shared/ui/publicacion-card.component';

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
    IonCardContent,
    IonIcon,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonRefresher,
    IonRefresherContent,
    PublicacionCardComponent,
    EstadoVacioComponent,
    EsqueletoListadoComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>KonectAll</ion-title>
        <ion-buttons slot="end">
          @if (!auth.usuario()) {
            <ion-button (click)="ir('/login')">Entrar</ion-button>
          }
          <ion-button (click)="abrirTema()" [attr.aria-label]="'Tema: ' + tema.modo()">
            <ion-icon slot="icon-only" [name]="iconoTema()"></ion-icon>
          </ion-button>
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
        <ion-card color="warning" class="aviso">
          <ion-card-content> Sin conexión. Mostrando la última información guardada en el teléfono. </ion-card-content>
        </ion-card>
      }

      <div class="saludo">
        <p class="eyebrow">Tu barrio, más conectado</p>
        <h1>{{ saludo() }}</h1>
      </div>

      @if (emergencias().length > 0) {
        <ion-card button color="danger" class="emergencia" (click)="ir('/tabs/emergencia')">
          <ion-card-content>
            <div class="emergencia-icono"><ion-icon name="alert-circle-outline"></ion-icon></div>
            <div>
              <strong>{{ emergencias().length }} ayuda(s) de emergencia activa(s)</strong>
              <p>Toca para ver el modo emergencia.</p>
            </div>
          </ion-card-content>
        </ion-card>
      }

      <ion-grid class="ion-no-padding categorias">
        <ion-row>
          <ion-col size="6">
            <ion-card button class="categoria cat-servicio" (click)="ir('/tabs/servicios')">
              <ion-card-content>
                <div class="categoria-icono"><ion-icon name="construct-outline"></ion-icon></div>
                <h2>Servicios y Productos</h2>
                <p>Oficios y cosas cerca de ti</p>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="6">
            <ion-card button class="categoria cat-intercambio" (click)="ir('/tabs/intercambios')">
              <ion-card-content>
                <div class="categoria-icono"><ion-icon name="swap-horizontal-outline"></ion-icon></div>
                <h2>Intercambios Solidarios</h2>
                <p>Sin dinero, con confianza</p>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="6">
            <ion-card button class="categoria cat-emergencia" (click)="ir('/tabs/emergencia')">
              <ion-card-content>
                <div class="categoria-icono"><ion-icon name="alert-circle-outline"></ion-icon></div>
                <h2>Emergencias</h2>
                <p>Pide u ofrece ayuda ya</p>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <ion-col size="6">
            <ion-card button class="categoria cat-comunidad" (click)="ir('/tabs/comunidad')">
              <ion-card-content>
                <div class="categoria-icono"><ion-icon name="people-outline"></ion-icon></div>
                <h2>Mi Comunidad</h2>
                <p>Vecinos y recomendaciones</p>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-searchbar
        [value]="busqueda()"
        placeholder="Buscar en tu barrio"
        (ionInput)="busqueda.set($any($event).detail.value ?? '')"
      ></ion-searchbar>

      <ion-segment [value]="radio().toString()" (ionChange)="cambiarRadio($any($event).detail.value)">
        <ion-segment-button value="0"><ion-label>Todos</ion-label></ion-segment-button>
        <ion-segment-button value="1"><ion-label>1 km</ion-label></ion-segment-button>
        <ion-segment-button value="3"><ion-label>3 km</ion-label></ion-segment-button>
        <ion-segment-button value="5"><ion-label>5 km</ion-label></ion-segment-button>
      </ion-segment>

      <div class="fila-titulo">
        <h2 class="titulo-seccion">Cerca de ti</h2>
        <span class="contador">{{ resultados().length }} publicaciones</span>
      </div>

      @if (pubs.cargando() && pubs.publicaciones().length === 0) {
        <app-esqueleto-listado [filas]="3"></app-esqueleto-listado>
      }

      @for (p of resultados().slice(0, 20); track p.id) {
        <app-publicacion-card [publicacion]="p" [style.--i]="$index" (abrir)="ver($event)"></app-publicacion-card>
      } @empty {
        @if (!pubs.cargando()) {
          <app-estado-vacio
            icono="search-outline"
            [titulo]="hayFiltros() ? 'Sin resultados' : 'Tu barrio está tranquilo'"
            [texto]="
              hayFiltros()
                ? 'Prueba con otro término o amplía el radio de búsqueda.'
                : 'Sé el primero en publicar algo para tus vecinos.'
            "
            [accionTexto]="hayFiltros() ? 'Limpiar filtros' : 'Publicar algo'"
            (accion)="hayFiltros() ? limpiarFiltros() : ir('/tabs/publicar')"
          ></app-estado-vacio>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      .aviso {
        margin: 0 0 12px;
      }
      .saludo {
        margin: 4px 0 14px;
      }
      .eyebrow {
        color: var(--app-muted);
        font-size: 0.78rem;
        margin: 0;
      }
      .saludo h1 {
        font-size: 1.55rem;
        font-weight: 700;
        margin: 2px 0 0;
      }
      .emergencia {
        margin: 0 0 14px;
      }
      .emergencia ion-card-content {
        align-items: center;
        display: flex;
        gap: 12px;
      }
      .emergencia-icono {
        align-items: center;
        background: rgba(255, 255, 255, 0.22);
        border-radius: 12px;
        display: flex;
        flex-shrink: 0;
        font-size: 22px;
        height: 42px;
        justify-content: center;
        width: 42px;
      }
      .emergencia strong {
        display: block;
        font-size: 0.95rem;
      }
      .emergencia p {
        font-size: 0.8rem;
        margin: 2px 0 0;
        opacity: 0.9;
      }
      .categorias {
        margin: 0 -5px;
      }
      .categorias ion-col {
        padding: 5px;
      }
      .categoria {
        --background: var(--cat-suave);
        --cat: var(--ion-color-primary);
        --cat-suave: rgba(var(--ion-color-primary-rgb), 0.12);
        border: 0;
        box-shadow: none;
        height: 100%;
        margin: 0;
      }
      .cat-servicio {
        --cat: var(--cat-servicio);
        --cat-suave: var(--cat-servicio-soft);
      }
      .cat-intercambio {
        --cat: var(--cat-intercambio);
        --cat-suave: var(--cat-intercambio-soft);
      }
      .cat-emergencia {
        --cat: var(--cat-emergencia);
        --cat-suave: var(--cat-emergencia-soft);
      }
      .cat-comunidad {
        --cat: var(--cat-comunidad);
        --cat-suave: var(--cat-comunidad-soft);
      }
      .categoria-icono {
        align-items: center;
        background: var(--app-surface);
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
        display: flex;
        height: 40px;
        justify-content: center;
        margin-bottom: 8px;
        width: 40px;
      }
      .categoria-icono ion-icon {
        color: var(--cat);
        font-size: 22px;
      }
      .categoria h2 {
        font-size: 0.92rem;
        font-weight: 600;
        line-height: 1.2;
        margin: 0 0 3px;
      }
      .categoria p {
        color: var(--app-muted);
        font-size: 0.72rem;
        line-height: 1.25;
        margin: 0;
      }
      .fila-titulo {
        align-items: baseline;
        display: flex;
        justify-content: space-between;
        margin: 20px 0 8px;
      }
      .titulo-seccion {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 0;
      }
      .contador {
        color: var(--app-muted);
        font-size: 0.75rem;
      }
    `,
  ],
})
export class InicioPage {
  readonly auth = inject(AuthService);
  readonly pubs = inject(PublicacionesService);
  readonly tema = inject(TemaService);
  private router = inject(Router);
  private sheet = inject(ActionSheetController);
  private ui = inject(UiService);

  readonly iconoTema = computed(() => {
    switch (this.tema.modo()) {
      case 'claro':
        return 'sunny-outline';
      case 'oscuro':
        return 'moon-outline';
      default:
        return 'contrast-outline';
    }
  });

  readonly enLinea = signal(navigator.onLine);
  readonly busqueda = signal('');
  readonly radio = signal(0);

  readonly saludo = computed(() => {
    const nombre = (this.auth.usuario()?.user_metadata?.['nombre'] as string | undefined) ?? 'vecino';
    return `Hola, ${nombre.split(/\s+/)[0]}`;
  });

  readonly hayFiltros = computed(() => this.busqueda().trim().length > 0 || this.radio() > 0);

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
    addIcons({
      alertCircleOutline,
      constructOutline,
      contrastOutline,
      ellipsisHorizontal,
      moonOutline,
      peopleOutline,
      sunnyOutline,
      swapHorizontalOutline,
    });
    window.addEventListener('online', () => this.enLinea.set(true));
    window.addEventListener('offline', () => this.enLinea.set(false));
  }

  async abrirTema(): Promise<void> {
    const sheet = await this.sheet.create({
      header: 'Apariencia',
      buttons: [
        { text: 'Claro', icon: 'sunny-outline', handler: () => this.tema.cambiar('claro') },
        { text: 'Oscuro', icon: 'moon-outline', handler: () => this.tema.cambiar('oscuro') },
        {
          text: 'Según el sistema',
          icon: 'contrast-outline',
          handler: () => this.tema.cambiar('sistema'),
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
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

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.radio.set(0);
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
