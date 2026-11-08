import type { OnInit } from '@angular/core';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  callOutline,
  chatbubbleEllipsesOutline,
  checkmarkDoneOutline,
  flagOutline,
  locationOutline,
  personRemoveOutline,
  thumbsUpOutline,
} from 'ionicons/icons';

import { AuthService } from '../../core/auth.service';
import type { Publicacion } from '../../core/models';
import { ModeracionService } from '../../core/moderacion.service';
import { PublicacionesService } from '../../core/publicaciones.service';
import { SupabaseService } from '../../core/supabase.service';
import { UiService } from '../../core/ui.service';
import { etiquetaCategoria, etiquetaEstado, etiquetaTipo, textoPrecio } from '../../shared/catalogo.util';
import { abrirWhatsApp } from '../../shared/contacto.util';
import { guardarContacto } from '../../shared/contactos.util';

@Component({
  selector: 'app-detalle',
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
    IonImg,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/inicio"></ion-back-button>
        </ion-buttons>
        <ion-title>Publicación</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (cargando()) {
        <div class="centrado"><ion-spinner></ion-spinner></div>
      }
      @if (!cargando() && publicacion(); as p) {
        <h1>{{ p.titulo }}</h1>

        <p class="autor">
          {{ p.perfiles?.nombre ?? 'Vecino' }}
          @if (p.perfiles?.barrio) {
            · {{ p.perfiles.barrio }}
          }
          · {{ p.distanciaKm?.toFixed(1) ?? '?' }} km
        </p>

        @if (p.direccion) {
          <p class="direccion"><ion-icon name="location-outline"></ion-icon> {{ p.direccion }}</p>
        }

        <div class="chips">
          <ion-chip color="primary" outline>{{ etiquetaTipo(p.tipo) }}</ion-chip>
          <ion-chip color="medium" outline>{{ etiquetaCategoria(p.categoria) }}</ion-chip>
          <ion-chip color="medium" outline>{{ textoPrecio(p.precio) }}</ion-chip>
          @if (p.modo === 'emergencia' || p.urgente) {
            <ion-chip color="danger" outline>Urgente</ion-chip>
          }
          <ion-chip [color]="p.estado === 'atendida' ? 'medium' : 'success'" outline>
            {{ etiquetaEstado(p.estado) }}
          </ion-chip>
        </div>

        @if (p.foto_url) {
          <ion-img class="foto" [src]="p.foto_url" [alt]="p.titulo"></ion-img>
        }

        @if (p.descripcion) {
          <p class="descripcion">{{ p.descripcion }}</p>
        }

        <ion-card>
          <ion-card-content>
            <strong>Visto Bueno Vecinal</strong>
            <p>
              {{ recomendaciones() }}
              {{ recomendaciones() === 1 ? 'vecino recomienda' : 'vecinos recomiendan' }}
              esta publicación.
            </p>
            @if (esMio()) {
              <ion-button expand="block" fill="outline" (click)="atender()">
                <ion-icon slot="start" name="checkmark-done-outline"></ion-icon>
                Marcar como atendida
              </ion-button>
            } @else {
              <ion-button
                expand="block"
                fill="outline"
                color="success"
                [disabled]="yaRecomende()"
                (click)="recomendar()"
              >
                <ion-icon slot="start" name="thumbs-up-outline"></ion-icon>
                {{ yaRecomende() ? 'Ya recomendaste' : 'Recomendar' }}
              </ion-button>
            }
          </ion-card-content>
        </ion-card>

        @if (!esMio()) {
          <ion-button expand="block" fill="outline" (click)="enviarMensaje()">
            <ion-icon slot="start" name="chatbubble-ellipses-outline"></ion-icon>
            Enviar mensaje
          </ion-button>
        }

        <ion-button expand="block" size="large" color="success" (click)="contactar()">
          <ion-icon slot="start" name="call-outline"></ion-icon>
          Contactar por WhatsApp
        </ion-button>

        @if (!esMio()) {
          <div class="moderacion">
            @if (!denunciado()) {
              <ion-button size="small" fill="outline" color="medium" (click)="reportar()">
                <ion-icon slot="start" name="flag-outline"></ion-icon>
                Reportar
              </ion-button>
            }
            <ion-button size="small" fill="outline" color="danger" (click)="bloquear()">
              <ion-icon slot="start" name="person-remove-outline"></ion-icon>
              Bloquear
            </ion-button>
          </div>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      h1 {
        font-size: 1.4rem;
        font-weight: 700;
        margin: 8px 0;
      }
      .autor {
        color: var(--ion-color-medium);
        margin-top: 0;
      }
      .direccion {
        align-items: center;
        color: var(--ion-color-medium);
        display: flex;
        gap: 4px;
        margin-top: 0;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .foto {
        width: 100%;
        border-radius: 12px;
        margin: 12px 0;
      }
      .descripcion {
        font-size: 1rem;
        line-height: 1.5;
      }
      .centrado {
        text-align: center;
        padding: 24px;
      }
      .moderacion {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: center;
        margin-top: 16px;
      }
    `,
  ],
})
export class DetallePage implements OnInit {
  readonly id = input.required<string>();

  private sb = inject(SupabaseService);
  private auth = inject(AuthService);
  private moderacion = inject(ModeracionService);
  private pubs = inject(PublicacionesService);
  private sheet = inject(ActionSheetController);
  private ui = inject(UiService);
  private router = inject(Router);

  readonly etiquetaTipo = etiquetaTipo;
  readonly etiquetaCategoria = etiquetaCategoria;
  readonly etiquetaEstado = etiquetaEstado;
  readonly textoPrecio = textoPrecio;

  readonly publicacion = signal<Publicacion | null>(null);
  readonly cargando = signal(true);
  readonly denunciado = signal(false);

  readonly esMio = computed(() => this.auth.usuario()?.id === this.publicacion()?.autor_id);
  readonly recomendaciones = computed(() => this.publicacion()?.recomendaciones?.[0]?.count ?? 0);
  readonly yaRecomende = computed(() => this.pubs.misRecomendaciones().has(this.publicacion()?.id ?? ''));

  constructor() {
    addIcons({
      callOutline,
      chatbubbleEllipsesOutline,
      thumbsUpOutline,
      checkmarkDoneOutline,
      flagOutline,
      locationOutline,
      personRemoveOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    const { data, error } = await this.sb.client
      .from('publicaciones')
      .select('*, perfiles(nombre, barrio), recomendaciones(count)')
      .eq('id', this.id())
      .single();
    if (error) {
      await this.ui.aviso('No se encontró la publicación', 'danger');
      await this.router.navigateByUrl('/tabs/inicio');
      return;
    }
    const pub = data as Publicacion;
    pub.distanciaKm = this.pubs.publicaciones().find((p) => p.id === pub.id)?.distanciaKm;
    this.publicacion.set(pub);
    this.cargando.set(false);
  }

  async enviarMensaje(): Promise<void> {
    const p = this.publicacion();
    if (!p) return;
    const user = await this.auth.usuarioActual();
    if (!user) {
      await this.router.navigate(['/login'], { queryParams: { redirect: `/chat/${p.id}/${p.autor_id}` } });
      return;
    }
    if (p.autor_id === user.id) {
      await this.ui.aviso('No puedes escribirte a ti mismo', 'warning');
      return;
    }
    await this.router.navigateByUrl(`/chat/${p.id}/${p.autor_id}`);
  }

  async reportar(): Promise<void> {
    const p = this.publicacion();
    if (!p) return;
    if (!(await this.auth.usuarioActual())) {
      await this.router.navigate(['/login'], { queryParams: { redirect: `/publicacion/${p.id}` } });
      return;
    }
    const hoja = await this.sheet.create({
      header: '¿Por qué reportas esta publicación?',
      buttons: [
        { text: 'Spam', handler: () => void this.enviarReporte(p.id, 'Spam') },
        { text: 'Estafa', handler: () => void this.enviarReporte(p.id, 'Estafa') },
        { text: 'Contenido inapropiado', handler: () => void this.enviarReporte(p.id, 'Contenido inapropiado') },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await hoja.present();
  }

  async bloquear(): Promise<void> {
    const p = this.publicacion();
    if (!p) return;
    if (!(await this.auth.usuarioActual())) {
      await this.router.navigate(['/login'], { queryParams: { redirect: `/publicacion/${p.id}` } });
      return;
    }
    if (!window.confirm(`¿Bloquear a ${p.perfiles?.nombre ?? 'este vecino'}? No volverás a ver sus publicaciones.`)) {
      return;
    }
    try {
      await this.moderacion.bloquear(p.autor_id);
      await this.ui.aviso('Vecino bloqueado', 'success');
      await this.router.navigateByUrl('/tabs/inicio');
    } catch {
      await this.ui.aviso('No se pudo bloquear', 'danger');
    }
  }

  private async enviarReporte(publicacionId: string, motivo: string): Promise<void> {
    try {
      await this.moderacion.denunciar({ publicacionId, motivo });
      this.denunciado.set(true);
      await this.ui.aviso('Gracias, revisaremos tu reporte', 'success');
    } catch {
      await this.ui.aviso('Ya reportaste esta publicación', 'warning');
    }
  }

  async contactar(): Promise<void> {
    const p = this.publicacion();
    if (!p) return;
    const telefono = await this.pubs.telefonoDe(p.id);
    if (!telefono) {
      await this.ui.aviso('Este vecino no tiene WhatsApp registrado', 'warning');
      return;
    }
    guardarContacto({
      publicacion_id: p.id,
      titulo: p.titulo,
      autor: p.perfiles?.nombre ?? 'Vecino',
      telefono,
      fecha: new Date().toISOString(),
    });
    abrirWhatsApp(telefono, `Hola ${p.perfiles?.nombre ?? ''}, te escribo por "${p.titulo}" en KonectAll.`);
  }

  async recomendar(): Promise<void> {
    const p = this.publicacion();
    if (!p) return;
    const user = await this.auth.usuarioActual();
    if (!user) {
      await this.router.navigate(['/login'], { queryParams: { redirect: `/publicacion/${p.id}` } });
      return;
    }
    if (p.autor_id === user.id) {
      await this.ui.aviso('No puedes recomendar tu propia publicación', 'warning');
      return;
    }
    if (this.pubs.misRecomendaciones().has(p.id)) {
      await this.ui.aviso('Ya recomendaste esta publicación', 'medium');
      return;
    }
    try {
      await this.pubs.recomendar(p.id);
      await this.cargar();
      await this.ui.aviso('¡Gracias por tu Visto Bueno Vecinal!', 'success');
    } catch {
      await this.ui.aviso('No se pudo registrar la recomendación', 'danger');
    }
  }

  async atender(): Promise<void> {
    const p = this.publicacion();
    if (!p) return;
    try {
      await this.pubs.marcarAtendida(p.id);
      await this.cargar();
      await this.ui.aviso('Publicación marcada como atendida', 'success');
    } catch {
      await this.ui.aviso('No se pudo actualizar la publicación', 'danger');
    }
  }
}
