import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import type { RefresherCustomEvent } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, callOutline, handLeftOutline, searchOutline } from 'ionicons/icons';

import type { Publicacion, TipoPublicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { UiService } from '../../core/ui.service';
import { abrirWhatsApp } from '../../shared/contacto.util';
import { EsqueletoListadoComponent } from '../../shared/ui/esqueleto-listado.component';
import { EstadoVacioComponent } from '../../shared/ui/estado-vacio.component';
import { PublicacionCardComponent } from '../../shared/ui/publicacion-card.component';

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
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonRefresher,
    IonRefresherContent,
    PublicacionCardComponent,
    EstadoVacioComponent,
    EsqueletoListadoComponent,
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

      <ion-card color="danger" class="aviso">
        <ion-card-content>
          <ion-icon name="alert-circle-outline"></ion-icon>
          <div>
            <strong>¿Necesitas ayuda urgente?</strong>
            <p>Si hay riesgo de vida, llama primero a los servicios de emergencia.</p>
          </div>
        </ion-card-content>
      </ion-card>

      <div class="acciones-rapidas">
        <ion-card button class="rapida pedir" (click)="publicar('necesito')">
          <ion-card-content>
            <div class="rapida-icono"><ion-icon name="search-outline"></ion-icon></div>
            <h2>Solicitar ayuda</h2>
            <p>¿Qué necesitas?</p>
          </ion-card-content>
        </ion-card>

        <ion-card button class="rapida ofrecer" (click)="publicar('ofrezco')">
          <ion-card-content>
            <div class="rapida-icono"><ion-icon name="hand-left-outline"></ion-icon></div>
            <h2>Ofrecer recursos</h2>
            <p>¿Qué puedes ofrecer?</p>
          </ion-card-content>
        </ion-card>
      </div>

      <h2 class="seccion">Urgentes cerca de ti</h2>

      @if (pubs.cargando() && emergencias().length === 0) {
        <app-esqueleto-listado [filas]="2"></app-esqueleto-listado>
      }

      @for (p of emergencias(); track p.id) {
        <app-publicacion-card [publicacion]="p" [interactiva]="false" [style.--i]="$index">
          <div class="acciones">
            <ion-button size="small" fill="outline" (click)="ver(p)">Ver detalle</ion-button>
            <ion-button size="small" color="success" (click)="whatsapp(p)">
              <ion-icon slot="start" name="call-outline"></ion-icon>
              WhatsApp
            </ion-button>
          </div>
        </app-publicacion-card>
      } @empty {
        @if (!pubs.cargando()) {
          <app-estado-vacio
            icono="alert-circle-outline"
            titulo="Todo tranquilo"
            texto="No hay pedidos de ayuda activos en tu zona."
          ></app-estado-vacio>
        }
      }

      <h2 class="seccion">Contactos de emergencia</h2>
      <ion-list class="contactos">
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
      .aviso ion-card-content {
        align-items: center;
        display: flex;
        gap: 12px;
      }
      .aviso ion-icon {
        font-size: 28px;
      }
      .aviso p {
        font-size: 0.8rem;
        margin: 2px 0 0;
        opacity: 0.9;
      }
      .acciones-rapidas {
        display: grid;
        gap: 10px;
        grid-template-columns: 1fr 1fr;
        margin: 14px 0;
      }
      .rapida {
        --background: var(--rapida-suave);
        border: 0;
        box-shadow: none;
        margin: 0;
      }
      .rapida ion-card-content {
        padding: 14px;
      }
      .rapida-icono {
        align-items: center;
        background: var(--app-surface);
        border-radius: 12px;
        color: var(--rapida);
        display: flex;
        font-size: 22px;
        height: 40px;
        justify-content: center;
        margin-bottom: 8px;
        width: 40px;
      }
      .rapida h2 {
        font-size: 0.95rem;
        font-weight: 600;
        margin: 0 0 2px;
      }
      .rapida p {
        color: var(--app-muted);
        font-size: 0.75rem;
        margin: 0;
      }
      .pedir {
        --rapida: var(--ion-color-danger);
        --rapida-suave: var(--cat-emergencia-soft);
      }
      .ofrecer {
        --rapida: var(--ion-color-success);
        --rapida-suave: var(--cat-comunidad-soft);
      }
      .seccion {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 18px 0 8px;
      }
      .acciones {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .contactos {
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        box-shadow: var(--app-shadow);
        margin: 8px 0 0;
      }
    `,
  ],
})
export class EmergenciaPage {
  readonly pubs = inject(PublicacionesService);
  private ui = inject(UiService);
  private router = inject(Router);

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
