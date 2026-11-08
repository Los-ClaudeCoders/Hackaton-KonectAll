import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import type { RefresherCustomEvent } from '@ionic/angular';

import { AuthService } from '../../core/auth.service';
import type { Publicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { UiService } from '../../core/ui.service';
import { resumirVecinos, totalRecomendaciones } from '../../shared/comunidad.util';
import { AvatarComponent } from '../../shared/ui/avatar.component';
import { EstadoVacioComponent } from '../../shared/ui/estado-vacio.component';
import { PublicacionCardComponent } from '../../shared/ui/publicacion-card.component';

@Component({
  selector: 'app-comunidad',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
    IonRefresher,
    IonRefresherContent,
    AvatarComponent,
    PublicacionCardComponent,
    EstadoVacioComponent,
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

      @if (!auth.usuario()) {
        <app-estado-vacio
          icono="people-outline"
          titulo="Únete a tu barrio"
          texto="Crea una cuenta para publicar y recomendar a tus vecinos."
          accionTexto="Iniciar sesión"
          (accion)="iniciarSesion()"
        ></app-estado-vacio>
      } @else if (barrio()) {
        <p class="barrio">Estás en {{ barrio() }}</p>
      }

      <div class="stats">
        <div class="stat">
          <strong>{{ vecinos().length }}</strong>
          <span>Vecinos</span>
        </div>
        <div class="stat">
          <strong>{{ activas() }}</strong>
          <span>Activas</span>
        </div>
        <div class="stat">
          <strong>{{ recomendaciones() }}</strong>
          <span>Vistos buenos</span>
        </div>
      </div>

      <h2 class="seccion">Vecinos activos</h2>
      <ion-list class="lista">
        @for (v of vecinos(); track v.autor_id) {
          <ion-item lines="none" class="vecino">
            <app-avatar slot="start" [nombre]="v.nombre" tamano="sm"></app-avatar>
            <ion-label>
              <h3>{{ v.nombre }}</h3>
              <p>{{ v.barrio ?? 'Arequipa' }}</p>
            </ion-label>
            <ion-note slot="end">{{ v.publicaciones }}</ion-note>
          </ion-item>
        } @empty {
          <ion-item lines="none">
            <ion-label>
              <p>La comunidad está despertando. Sé el primero en publicar algo.</p>
            </ion-label>
          </ion-item>
        }
      </ion-list>

      <h2 class="seccion">Más recomendados</h2>
      @for (p of recomendados(); track p.id) {
        <app-publicacion-card [publicacion]="p" [style.--i]="$index" (abrir)="ver($event)">
          <p class="reco">
            {{ p.recomendaciones?.[0]?.count ?? 0 }}
            {{ (p.recomendaciones?.[0]?.count ?? 0) === 1 ? 'recomendación' : 'recomendaciones' }}
          </p>
        </app-publicacion-card>
      } @empty {
        <p class="dato">Todavía no hay publicaciones recomendadas.</p>
      }
    </ion-content>
  `,
  styles: [
    `
      .barrio {
        color: var(--app-muted);
        font-size: 0.82rem;
        margin: 0 0 8px;
      }
      .stats {
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        box-shadow: var(--app-shadow);
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        margin: 16px 0;
        padding: 14px 8px;
        text-align: center;
      }
      .stat strong {
        color: var(--app-text);
        display: block;
        font-size: 1.35rem;
        font-weight: 700;
      }
      .stat span {
        color: var(--app-muted);
        font-size: 0.7rem;
      }
      .seccion {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 18px 0 8px;
      }
      .lista {
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        box-shadow: var(--app-shadow);
        margin: 0;
        padding: 4px 0;
      }
      .vecino h3 {
        font-size: 0.9rem;
        font-weight: 600;
        margin: 0;
      }
      .vecino p {
        color: var(--app-muted);
        font-size: 0.75rem;
        margin: 2px 0 0;
      }
      .reco {
        color: var(--ion-color-success);
        font-size: 0.78rem;
        font-weight: 600;
        margin: 6px 0 0;
      }
      .dato {
        color: var(--app-muted);
        font-size: 0.85rem;
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

  async refrescar(evento: RefresherCustomEvent): Promise<void> {
    try {
      await this.pubs.cargar();
    } catch {
      await this.ui.aviso('No se pudo cargar la comunidad', 'danger');
    } finally {
      await evento.target.complete();
    }
  }

  barrio(): string | null {
    return (this.auth.usuario()?.user_metadata?.['barrio'] as string | undefined) ?? null;
  }

  iniciarSesion(): void {
    void this.router.navigate(['/login'], { queryParams: { redirect: '/tabs/comunidad' } });
  }

  ver(p: Publicacion): void {
    void this.router.navigateByUrl(`/publicacion/${p.id}`);
  }
}
