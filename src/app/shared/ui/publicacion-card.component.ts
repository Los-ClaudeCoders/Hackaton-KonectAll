import { Component, computed, input, output } from '@angular/core';
import { IonCard, IonCardContent, IonChip, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  bagHandleOutline,
  constructOutline,
  pricetagOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';

import type { Publicacion } from '../../core/models';
import { colorTipo, etiquetaTipo, textoPrecio, visualPublicacion } from '../../shared/catalogo.util';

import { AvatarComponent } from './avatar.component';

@Component({
  selector: 'app-publicacion-card',
  standalone: true,
  imports: [IonCard, IonCardContent, IonChip, IonIcon, AvatarComponent],
  template: `
    <ion-card [button]="interactiva()" (click)="interactiva() && abrir.emit(publicacion())">
      <div class="media" [style.background]="visual().suave">
        @if (publicacion().foto_url) {
          <img
            class="foto"
            [src]="publicacion().foto_url"
            [alt]="publicacion().titulo"
            loading="lazy"
            decoding="async"
          />
        } @else {
          <ion-icon class="icono" [name]="visual().icono" [style.color]="visual().color"></ion-icon>
        }
        <span class="precio" [class.gratis]="gratis()">
          {{ textoPrecio(publicacion().precio) }}
        </span>
      </div>

      <ion-card-content>
        <div class="autor">
          <app-avatar [nombre]="nombre()" tamano="sm"></app-avatar>
          <div class="autor-info">
            <span class="nombre">{{ nombre() }}</span>
            <span class="meta">{{ barrio() }} · {{ distancia() }}</span>
          </div>
        </div>

        <h2 class="titulo">{{ publicacion().titulo }}</h2>

        <div class="chips">
          <ion-chip [color]="colorTipo(publicacion().tipo)" outline>
            {{ etiquetaTipo(publicacion().tipo) }}
          </ion-chip>
          @if (publicacion().urgente || publicacion().modo === 'emergencia') {
            <ion-chip color="danger" outline>Urgente</ion-chip>
          }
        </div>

        <ng-content></ng-content>
      </ion-card-content>
    </ion-card>
  `,
  styles: [
    `
      ion-card {
        margin: 12px 0;
        overflow: hidden;
      }
      .media {
        align-items: center;
        display: flex;
        height: 132px;
        justify-content: center;
        overflow: hidden;
        position: relative;
      }
      .foto {
        display: block;
        height: 100%;
        object-fit: cover;
        width: 100%;
      }
      .icono {
        font-size: 52px;
        opacity: 0.9;
      }
      .precio {
        background: var(--app-surface);
        border-radius: 999px;
        bottom: 10px;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.16);
        color: var(--app-text);
        font-size: 0.82rem;
        font-weight: 700;
        padding: 4px 10px;
        position: absolute;
        right: 10px;
      }
      .precio.gratis {
        background: var(--ion-color-success);
        color: var(--ion-color-success-contrast);
      }
      ion-card-content {
        padding: 12px 14px 14px;
      }
      .autor {
        align-items: center;
        display: flex;
        gap: 8px;
        margin-bottom: 8px;
      }
      .autor-info {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
        min-width: 0;
      }
      .nombre {
        color: var(--app-text);
        font-size: 0.78rem;
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .meta {
        color: var(--app-muted);
        font-size: 0.72rem;
      }
      .titulo {
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        color: var(--app-text);
        display: -webkit-box;
        font-size: 1.02rem;
        font-weight: 600;
        line-height: 1.3;
        margin: 0 0 8px;
        overflow: hidden;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .chips ion-chip {
        height: 24px;
        font-size: 0.72rem;
      }
    `,
  ],
})
export class PublicacionCardComponent {
  readonly publicacion = input.required<Publicacion>();
  readonly interactiva = input(true);
  readonly abrir = output<Publicacion>();

  readonly colorTipo = colorTipo;
  readonly etiquetaTipo = etiquetaTipo;
  readonly textoPrecio = textoPrecio;

  readonly visual = computed(() => visualPublicacion(this.publicacion()));
  readonly nombre = computed(() => this.publicacion().perfiles?.nombre ?? 'Vecino');
  readonly barrio = computed(() => this.publicacion().perfiles?.barrio ?? 'Arequipa');
  readonly distancia = computed(() => `${this.publicacion().distanciaKm?.toFixed(1) ?? '?'} km`);
  readonly gratis = computed(() => {
    const precio = this.publicacion().precio;
    return precio === null || precio === undefined;
  });

  constructor() {
    addIcons({
      alertCircleOutline,
      bagHandleOutline,
      constructOutline,
      pricetagOutline,
      swapHorizontalOutline,
    });
  }
}
