import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonRow,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import type { RefresherCustomEvent } from '@ionic/angular';

import { AuthService } from '../../core/auth.service';
import type { Publicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { UiService } from '../../core/ui.service';
import { resumirVecinos, totalRecomendaciones } from '../../shared/comunidad.util';

@Component({
  selector: 'app-comunidad',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonCard,
    IonCardContent,
    IonButton,
    IonRefresher,
    IonRefresherContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mi comunidad</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="refrescar($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <ion-grid class="resumen">
        <ion-row>
          <ion-col>
            <ion-card>
              <ion-card-content>
                <strong>{{ vecinos().length }}</strong>
                <span>vecinos</span>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col>
            <ion-card>
              <ion-card-content>
                <strong>{{ activas() }}</strong>
                <span>activas</span>
              </ion-card-content>
            </ion-card>
          </ion-col>
          <ion-col>
            <ion-card>
              <ion-card-content>
                <strong>{{ recomendaciones() }}</strong>
                <span>vistos buenos</span>
              </ion-card-content>
            </ion-card>
          </ion-col>
        </ion-row>
      </ion-grid>

      @if (!auth.usuario()) {
        <ion-card>
          <ion-card-content>
            <strong>Únete a tu barrio</strong>
            <p>Crea una cuenta para publicar y recomendar a tus vecinos.</p>
            <ion-button expand="block" fill="outline" (click)="iniciarSesion()">Iniciar sesión</ion-button>
          </ion-card-content>
        </ion-card>
      } @else if (barrio()) {
        <p class="dato">Tu barrio: {{ barrio() }}</p>
      }

      <h2>Vecinos activos</h2>
      <ion-list lines="full">
        @for (v of vecinos(); track v.autor_id) {
          <ion-item>
            <ion-label>
              <h3>{{ v.nombre }}</h3>
              <p>{{ v.barrio ?? 'Arequipa' }}</p>
            </ion-label>
            <ion-note slot="end">{{ v.publicaciones }} publicación(es)</ion-note>
          </ion-item>
        } @empty {
          <ion-item>
            <ion-label>
              <p>La comunidad está despertando. Sé el primero en publicar algo.</p>
            </ion-label>
          </ion-item>
        }
      </ion-list>

      <h2>Más recomendados</h2>
      @for (p of recomendados(); track p.id) {
        <ion-card button (click)="ver(p)">
          <ion-card-content>
            <h3>{{ p.titulo }}</h3>
            <p class="dato">{{ p.perfiles?.nombre ?? 'Vecino' }} · {{ p.perfiles?.barrio ?? 'Arequipa' }}</p>
            <ion-note color="success">
              {{ p.recomendaciones?.[0]?.count ?? 0 }}
              {{ (p.recomendaciones?.[0]?.count ?? 0) === 1 ? 'recomendación' : 'recomendaciones' }}
            </ion-note>
          </ion-card-content>
        </ion-card>
      } @empty {
        <p class="dato">Todavía no hay publicaciones recomendadas.</p>
      }
    </ion-content>
  `,
  styles: [
    `
      h2 {
        margin-top: 20px;
      }
      .resumen ion-card {
        margin: 0;
        text-align: center;
      }
      .resumen strong {
        display: block;
        font-size: 1.5rem;
      }
      .resumen span {
        color: var(--ion-color-medium);
        font-size: 0.8rem;
      }
      .dato {
        color: var(--ion-color-medium);
      }
    `,
  ],
})
export class ComunidadPage {
  readonly auth = inject(AuthService);
  private pubs = inject(PublicacionesService);
  private ui = inject(UiService);
  private router = inject(Router);

  readonly vecinos = computed(() => resumirVecinos(this.pubs.publicaciones()));
  readonly recomendaciones = computed(() => totalRecomendaciones(this.pubs.publicaciones()));
  readonly activas = computed(() => this.pubs.cercanas().length);

  readonly recomendados = computed(() =>
    this.pubs
      .cercanas()
      .filter((p) => (p.recomendaciones?.[0]?.count ?? 0) > 0)
      .sort((a, b) => (b.recomendaciones?.[0]?.count ?? 0) - (a.recomendaciones?.[0]?.count ?? 0))
      .slice(0, 5),
  );

  async ionViewWillEnter(): Promise<void> {
    this.pubs.suscribir();
    try {
      await this.pubs.cargar();
    } catch {
      await this.ui.aviso('No se pudo cargar la comunidad', 'danger');
    }
  }

  barrio(): string | null {
    return (this.auth.usuario()?.user_metadata?.['barrio'] as string | undefined) ?? null;
  }

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    try {
      await this.pubs.cargar();
    } catch {
      await this.ui.aviso('No se pudo cargar la comunidad', 'danger');
    } finally {
      await evento.target.complete();
    }
  }

  iniciarSesion(): void {
    void this.router.navigateByUrl('/login');
  }

  ver(p: Publicacion): void {
    void this.router.navigateByUrl(`/publicacion/${p.id}`);
  }
}
