import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import type { RefresherCustomEvent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, callOutline, handLeftOutline, searchOutline } from 'ionicons/icons';

import type { Publicacion, TipoPublicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { UiService } from '../../core/ui.service';
import { etiquetaTipo, textoPrecio } from '../../shared/catalogo.util';
import { abrirWhatsApp } from '../../shared/contacto.util';

@Component({
  selector: 'app-emergencia',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonCard,
    IonCardContent,
    IonChip,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="danger">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/inicio" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title>Modo emergencia</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-card color="danger">
        <ion-card-content>
          Si hay riesgo de vida, llama primero a los servicios de emergencia. Usa esta pantalla para pedir u ofrecer
          ayuda a tus vecinos.
        </ion-card-content>
      </ion-card>

      <ion-button expand="block" color="danger" size="large" (click)="publicar('necesito')">
        <ion-icon slot="start" name="search-outline"></ion-icon>
        Pedir ayuda
      </ion-button>

      <ion-button
        class="campo"
        expand="block"
        color="success"
        fill="outline"
        size="large"
        (click)="publicar('ofrezco')"
      >
        <ion-icon slot="start" name="hand-left-outline"></ion-icon>
        Ofrecer recursos
      </ion-button>

      <h2>Urgentes cerca de ti</h2>

      @if (pubs.cargando() && emergencias().length === 0) {
        <div class="centrado"><ion-spinner></ion-spinner></div>
      }

      @for (p of emergencias(); track p.id) {
        <ion-card>
          <ion-card-content>
            <ion-chip color="danger" outline>{{ etiquetaTipo(p.tipo) }}</ion-chip>
            <ion-chip color="medium" outline>{{ textoPrecio(p.precio) }}</ion-chip>
            <h3>{{ p.titulo }}</h3>
            <p class="dato">
              {{ p.perfiles?.nombre ?? 'Vecino' }}
              @if (p.perfiles?.barrio) {
                · {{ p.perfiles.barrio }}
              }
              · {{ p.distanciaKm?.toFixed(1) ?? '?' }} km
            </p>
            @if (p.descripcion) {
              <p>{{ p.descripcion }}</p>
            }
            <div class="acciones">
              <ion-button size="small" fill="outline" (click)="ver(p)">Ver detalle</ion-button>
              <ion-button size="small" color="success" (click)="whatsapp(p)">
                <ion-icon slot="start" name="call-outline"></ion-icon>
                WhatsApp
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      } @empty {
        @if (!pubs.cargando()) {
          <p class="dato">No hay pedidos de ayuda activos. Todo tranquilo por ahora.</p>
        }
      }

      <h2>Contactos de emergencia</h2>
      <ion-list>
        <ion-item href="tel:105">
          <ion-icon slot="start" name="call-outline" color="primary"></ion-icon>
          <ion-label>Policía · 105</ion-label>
        </ion-item>
        <ion-item href="tel:116">
          <ion-icon slot="start" name="call-outline" color="danger"></ion-icon>
          <ion-label>Bomberos · 116</ion-label>
        </ion-item>
        <ion-item href="tel:106">
          <ion-icon slot="start" name="call-outline" color="success"></ion-icon>
          <ion-label>SAMU · 106</ion-label>
        </ion-item>
        <ion-item href="tel:115">
          <ion-icon slot="start" name="call-outline" color="warning"></ion-icon>
          <ion-label>Defensa Civil · 115</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: [
    `
      .campo {
        margin-top: 12px;
      }
      .centrado {
        text-align: center;
        padding: 24px;
      }
      .dato {
        color: var(--ion-color-medium);
        font-size: 0.85rem;
      }
      .acciones {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      h3 {
        margin: 8px 0 4px;
      }
    `,
  ],
})
export class EmergenciaPage {
  readonly pubs = inject(PublicacionesService);
  private ui = inject(UiService);
  private router = inject(Router);

  readonly etiquetaTipo = etiquetaTipo;
  readonly textoPrecio = textoPrecio;

  readonly emergencias = computed(() => this.pubs.cercanas().filter((p) => p.modo === 'emergencia'));

  constructor() {
    addIcons({ alertCircleOutline, searchOutline, handLeftOutline, callOutline });
  }

  async ionViewWillEnter(): Promise<void> {
    this.pubs.suscribir();
    try {
      await this.pubs.cargar();
    } catch {
      await this.ui.aviso('No se pudieron cargar las emergencias', 'danger');
    }
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    try {
      await this.pubs.cargar();
    } catch {
      await this.ui.aviso('No se pudieron cargar las emergencias', 'danger');
    } finally {
      await evento.target.complete();
    }
  }

  publicar(tipo: TipoPublicacion): void {
    void this.router.navigate(['/tabs/publicar'], {
      queryParams: { modo: 'emergencia', tipo, urgente: 1 },
    });
  }

  ver(p: Publicacion): void {
    void this.router.navigateByUrl(`/publicacion/${p.id}`);
  }

  async whatsapp(p: Publicacion): Promise<void> {
    const telefono = await this.pubs.telefonoDe(p.id);
    if (!telefono) {
      await this.ui.aviso('Este vecino no tiene WhatsApp registrado', 'warning');
      return;
    }
    abrirWhatsApp(telefono, `Hola ${p.perfiles?.nombre ?? ''}, vi tu pedido de ayuda "${p.titulo}" en KonectAll.`);
  }
}
