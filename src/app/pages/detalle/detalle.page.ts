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
  IonFooter,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  bagHandleOutline,
  chatbubbleEllipsesOutline,
  checkmarkDoneOutline,
  constructOutline,
  flagOutline,
  locationOutline,
  logoWhatsapp,
  personRemoveOutline,
  pricetagOutline,
  swapHorizontalOutline,
  thumbsUpOutline,
} from 'ionicons/icons';

import { AuthService } from '../../core/auth.service';
import type { Publicacion } from '../../core/models';
import { ModeracionService } from '../../core/moderacion.service';
import { PublicacionesService } from '../../core/publicaciones.service';
import { SupabaseService } from '../../core/supabase.service';
import { UiService } from '../../core/ui.service';
import {
  colorTipo,
  etiquetaCategoria,
  etiquetaEstado,
  etiquetaTipo,
  textoPrecio,
  visualPublicacion,
} from '../../shared/catalogo.util';
import { abrirWhatsApp } from '../../shared/contacto.util';
import { guardarContacto } from '../../shared/contactos.util';
import { AvatarComponent } from '../../shared/ui/avatar.component';

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
    IonFooter,
    IonIcon,
    IonSpinner,
    AvatarComponent,
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
        <div class="hero" [style.background]="visual().suave">
          @if (p.foto_url) {
            <img class="hero-foto" [src]="p.foto_url" [alt]="p.titulo" />
          } @else {
            <ion-icon class="hero-icono" [name]="visual().icono" [style.color]="visual().color"></ion-icon>
          }
          <ion-chip class="estado" [color]="p.estado === 'atendida' ? 'medium' : 'success'">
            {{ etiquetaEstado(p.estado) }}
          </ion-chip>
        </div>

        <div class="contenido">
          <div class="autor">
            <app-avatar [nombre]="p.perfiles?.nombre ?? 'Vecino'" tamano="md"></app-avatar>
            <div class="autor-info">
              <strong>{{ p.perfiles?.nombre ?? 'Vecino' }}</strong>
              <span>
                {{ p.perfiles?.barrio ?? 'Arequipa' }} · {{ p.distanciaKm?.toFixed(1) ?? '?' }} km ·
                {{ fecha(p.creado_en) }}
              </span>
            </div>
            <span class="precio" [class.gratis]="esGratis()">{{ textoPrecio(p.precio) }}</span>
          </div>

          <h1>{{ p.titulo }}</h1>

          @if (p.direccion) {
            <p class="direccion"><ion-icon name="location-outline"></ion-icon> {{ p.direccion }}</p>
          }

          <div class="chips">
            <ion-chip [color]="colorTipo(p.tipo)" outline>{{ etiquetaTipo(p.tipo) }}</ion-chip>
            <ion-chip color="medium" outline>{{ etiquetaCategoria(p.categoria) }}</ion-chip>
            @if (p.modo === 'emergencia' || p.urgente) {
              <ion-chip color="danger" outline>Urgente</ion-chip>
            }
          </div>

          @if (p.descripcion) {
            <p class="descripcion">{{ p.descripcion }}</p>
          }

          <ion-card class="recomendacion">
            <ion-card-content>
              <div class="reco-fila">
                <div class="reco-icono"><ion-icon name="thumbs-up-outline"></ion-icon></div>
                <div>
                  <strong>Visto Bueno Vecinal</strong>
                  <p>
                    {{ recomendaciones() }}
                    {{ recomendaciones() === 1 ? 'vecino recomienda' : 'vecinos recomiendan' }}
                    esta publicación.
                  </p>
                </div>
              </div>
              @if (esMio()) {
                <ion-button expand="block" fill="outline" (click)="atender()">
                  <ion-icon slot="start" name="checkmark-done-outline"></ion-icon>
                  Marcar como atendida
                </ion-button>
              }
            </ion-card-content>
          </ion-card>

          @if (!esMio()) {
            <div class="moderacion">
              @if (!denunciado()) {
                <ion-button size="small" fill="clear" color="medium" (click)="reportar()">
                  <ion-icon slot="start" name="flag-outline"></ion-icon>
                  Reportar
                </ion-button>
              }
              <ion-button size="small" fill="clear" color="danger" (click)="bloquear()">
                <ion-icon slot="start" name="person-remove-outline"></ion-icon>
                Bloquear
              </ion-button>
            </div>
          }
        </div>
      }
    </ion-content>

    @if (!esMio() && publicacion()) {
      <ion-footer>
        <ion-toolbar class="pie">
          <div class="acciones">
            <ion-button class="principal" expand="block" color="success" (click)="contactar()">
              <ion-icon slot="start" name="logo-whatsapp"></ion-icon>
              Contactar
            </ion-button>
            <ion-button expand="block" fill="outline" (click)="enviarMensaje()">
              <ion-icon slot="start" name="chatbubble-ellipses-outline"></ion-icon>
              Enviar mensaje
            </ion-button>
            <ion-button expand="block" fill="outline" color="success" [disabled]="yaRecomende()" (click)="recomendar()">
              <ion-icon slot="start" name="thumbs-up-outline"></ion-icon>
              {{ yaRecomende() ? 'Ya recomendaste' : 'Recomendar' }}
            </ion-button>
          </div>
        </ion-toolbar>
      </ion-footer>
    }
  `,
  styles: [
    `
      .centrado {
        padding: 24px;
        text-align: center;
      }
      .hero {
        align-items: center;
        border-radius: 0 0 22px 22px;
        display: flex;
        height: 220px;
        justify-content: center;
        margin: -16px -16px 16px;
        overflow: hidden;
        position: relative;
      }
      .hero-foto {
        display: block;
        height: 100%;
        object-fit: cover;
        width: 100%;
      }
      .hero-icono {
        font-size: 84px;
        opacity: 0.85;
      }
      .estado {
        position: absolute;
        right: 14px;
        top: 14px;
      }
      .autor {
        align-items: center;
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }
      .autor-info {
        display: flex;
        flex: 1;
        flex-direction: column;
        line-height: 1.3;
        min-width: 0;
      }
      .autor-info strong {
        font-size: 0.9rem;
        font-weight: 600;
      }
      .autor-info span {
        color: var(--app-muted);
        font-size: 0.74rem;
      }
      .precio {
        background: var(--app-surface-2);
        border-radius: 999px;
        font-size: 1rem;
        font-weight: 700;
        padding: 6px 12px;
        white-space: nowrap;
      }
      .precio.gratis {
        background: var(--ion-color-success);
        color: var(--ion-color-success-contrast);
      }
      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1.25;
        margin: 0 0 8px;
      }
      .direccion {
        align-items: center;
        color: var(--app-muted);
        display: flex;
        gap: 4px;
        margin: 0 0 8px;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 12px;
      }
      .descripcion {
        color: var(--app-text);
        font-size: 0.98rem;
        line-height: 1.55;
        margin: 0 0 16px;
        white-space: pre-wrap;
      }
      .recomendacion {
        margin-top: 4px;
      }
      .reco-fila {
        align-items: center;
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }
      .reco-icono {
        align-items: center;
        background: var(--cat-comunidad-soft);
        border-radius: 12px;
        color: var(--cat-comunidad);
        display: flex;
        flex-shrink: 0;
        font-size: 22px;
        height: 42px;
        justify-content: center;
        width: 42px;
      }
      .reco-fila p {
        color: var(--app-muted);
        font-size: 0.82rem;
        margin: 2px 0 0;
      }
      .moderacion {
        display: flex;
        gap: 4px;
        justify-content: center;
        margin-top: 8px;
      }
      .pie {
        --background: var(--app-surface);
        border-top: 1px solid var(--app-border);
        padding: 12px 18px calc(14px + env(safe-area-inset-bottom));
      }
      .acciones {
        display: grid;
        gap: 10px;
        grid-template-columns: 1fr 1fr;
        margin: 0 auto;
        max-width: 560px;
      }
      .acciones ion-button {
        font-size: 0.82rem;
        margin: 0;
        min-height: 44px;
      }
      .acciones ion-icon {
        font-size: 18px;
      }
      .acciones .principal {
        font-size: 0.9rem;
        grid-column: 1 / -1;
        min-height: 48px;
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

  readonly colorTipo = colorTipo;
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
  readonly visual = computed(() => {
    const p = this.publicacion();
    return p
      ? visualPublicacion(p)
      : { color: 'var(--ion-color-primary)', suave: 'var(--app-surface-2)', icono: 'pricetag-outline' };
  });
  readonly esGratis = computed(() => {
    const precio = this.publicacion()?.precio;
    return precio === null || precio === undefined;
  });

  constructor() {
    addIcons({
      alertCircleOutline,
      bagHandleOutline,
      chatbubbleEllipsesOutline,
      checkmarkDoneOutline,
      constructOutline,
      flagOutline,
      locationOutline,
      logoWhatsapp,
      personRemoveOutline,
      pricetagOutline,
      swapHorizontalOutline,
      thumbsUpOutline,
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

  fecha(iso: string): string {
    const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
    if (minutos < 1) return 'ahora';
    if (minutos < 60) return `hace ${minutos} min`;
    const horas = Math.round(minutos / 60);
    if (horas < 24) return `hace ${horas} h`;
    const dias = Math.round(horas / 24);
    if (dias < 7) return `hace ${dias} d`;
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
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
