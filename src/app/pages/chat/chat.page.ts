import type { OnDestroy } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, logoWhatsapp } from 'ionicons/icons';

import { AuthService } from '../../core/auth.service';
import { MensajesService } from '../../core/mensajes.service';
import type { ConversacionResumen } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { UiService } from '../../core/ui.service';
import { abrirWhatsApp } from '../../shared/contacto.util';
import type { ContactoChat } from '../../shared/contactos.util';
import { borrarContactos, leerContactos } from '../../shared/contactos.util';
import { mensajeError } from '../../shared/errores.util';
import { AvatarComponent } from '../../shared/ui/avatar.component';
import { EstadoVacioComponent } from '../../shared/ui/estado-vacio.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSkeletonText,
    AvatarComponent,
    EstadoVacioComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Chat</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (!auth.usuario()) {
        <app-estado-vacio
          icono="chatbubbles-outline"
          titulo="Mensajes con tus vecinos"
          texto="Inicia sesión para conversar sobre una publicación."
          accionTexto="Iniciar sesión"
          (accion)="iniciarSesion()"
        ></app-estado-vacio>
      } @else {
        <h2 class="seccion">Conversaciones</h2>

        @if (cargando()) {
          @for (i of [1, 2, 3]; track i) {
            <ion-card>
              <ion-card-content class="esqueleto">
                <ion-skeleton-text [animated]="true" style="width: 55%; height: 14px"></ion-skeleton-text>
                <ion-skeleton-text [animated]="true" style="width: 85%; height: 12px"></ion-skeleton-text>
              </ion-card-content>
            </ion-card>
          }
        }

        @for (c of conversaciones(); track c.publicacion_id + ':' + c.otro_id) {
          <ion-card button class="aparecer conversacion" [style.--i]="$index" (click)="abrir(c)">
            <ion-card-content>
              <app-avatar [nombre]="c.otro_nombre" tamano="md"></app-avatar>
              <div class="info">
                <div class="linea">
                  <strong>{{ c.otro_nombre }}</strong>
                  <span>{{ fecha(c) }}</span>
                </div>
                <h3 class="titulo">{{ c.titulo }}</h3>
                <p class="ultimo">{{ c.ultimo_texto }}</p>
              </div>
            </ion-card-content>
          </ion-card>
        } @empty {
          @if (!cargando()) {
            <app-estado-vacio
              icono="chatbubbles-outline"
              titulo="Sin conversaciones"
              texto="Entra a una publicación y toca “Enviar mensaje”."
              accionTexto="Ver publicaciones"
              (accion)="explorar()"
            ></app-estado-vacio>
          }
        }
      }

      @if (contactos().length) {
        <div class="fila-seccion">
          <h2 class="seccion">Contactos por WhatsApp</h2>
          <ion-button fill="clear" size="small" color="medium" (click)="limpiar()">Limpiar</ion-button>
        </div>

        @for (c of contactos(); track c.publicacion_id) {
          <ion-card class="aparecer contacto" [style.--i]="$index">
            <ion-card-content>
              <div class="contacto-icono"><ion-icon name="logo-whatsapp"></ion-icon></div>
              <div class="info">
                <p class="titulo">{{ c.titulo }}</p>
                <p class="dato">{{ c.autor }} · {{ fechaContacto(c) }}</p>
              </div>
              <ion-button size="small" fill="clear" color="success" (click)="whatsapp(c)">WhatsApp</ion-button>
              <ion-button size="small" fill="clear" (click)="ver(c)">Ver</ion-button>
            </ion-card-content>
          </ion-card>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      .seccion {
        font-size: 1.1rem;
        font-weight: 700;
        margin: 18px 0 8px;
      }
      .esqueleto {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .conversacion ion-card-content {
        align-items: center;
        display: flex;
        gap: 10px;
      }
      .info {
        flex: 1;
        min-width: 0;
      }
      .linea {
        display: flex;
        gap: 8px;
        justify-content: space-between;
      }
      .linea strong {
        font-size: 0.9rem;
        font-weight: 600;
      }
      .linea span {
        color: var(--app-muted);
        font-size: 0.7rem;
        white-space: nowrap;
      }
      .titulo {
        color: var(--ion-color-primary);
        font-size: 0.8rem;
        font-weight: 600;
        margin: 2px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ultimo {
        color: var(--app-muted);
        font-size: 0.8rem;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .dato {
        color: var(--app-muted);
        font-size: 0.75rem;
        margin: 0;
      }
      .fila-seccion {
        align-items: center;
        display: flex;
        justify-content: space-between;
      }
      .contacto ion-card-content {
        align-items: center;
        display: flex;
        gap: 8px;
      }
      .contacto-icono {
        align-items: center;
        background: var(--cat-comunidad-soft);
        border-radius: 12px;
        color: var(--cat-comunidad);
        display: flex;
        flex-shrink: 0;
        font-size: 20px;
        height: 38px;
        justify-content: center;
        width: 38px;
      }
    `,
  ],
})
export class ChatPage implements OnDestroy {
  readonly auth = inject(AuthService);
  private mensajes = inject(MensajesService);
  private pubs = inject(PublicacionesService);
  private ui = inject(UiService);
  private router = inject(Router);

  readonly conversaciones = signal<ConversacionResumen[]>([]);
  readonly contactos = signal<ContactoChat[]>([]);
  readonly cargando = signal(false);

  constructor() {
    addIcons({ chatbubblesOutline, logoWhatsapp });
  }

  async ionViewWillEnter(): Promise<void> {
    this.contactos.set(leerContactos());
    const user = await this.auth.usuarioActual();
    if (!user) {
      this.conversaciones.set([]);
      return;
    }
    if (!this.auth.usuario()) this.auth.usuario.set(user);
    this.pubs.suscribir();
    await this.cargar();
    await this.mensajes.refrescarNoLeidos();
    this.mensajes.suscribir(() => void this.cargar());
  }

  ionViewWillLeave(): void {
    this.mensajes.detener();
  }

  ngOnDestroy(): void {
    this.mensajes.detener();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    try {
      if (this.pubs.publicaciones().length === 0) await this.pubs.cargar();
      this.conversaciones.set(await this.mensajes.conversaciones());
    } catch (e) {
      await this.ui.aviso(mensajeError(e, 'No se pudieron cargar los mensajes'), 'danger');
    } finally {
      this.cargando.set(false);
    }
  }

  abrir(c: ConversacionResumen): void {
    void this.router.navigateByUrl(`/chat/${c.publicacion_id}/${c.otro_id}`);
  }

  iniciarSesion(): void {
    void this.router.navigate(['/login'], { queryParams: { redirect: '/tabs/chat' } });
  }

  explorar(): void {
    void this.router.navigateByUrl('/tabs/inicio');
  }

  whatsapp(c: ContactoChat): void {
    abrirWhatsApp(c.telefono, `Hola ${c.autor}, te escribo por "${c.titulo}" en KonectAll.`);
  }

  ver(c: ContactoChat): void {
    void this.router.navigateByUrl(`/publicacion/${c.publicacion_id}`);
  }

  limpiar(): void {
    borrarContactos();
    this.contactos.set([]);
  }

  fecha(c: ConversacionResumen): string {
    return new Date(c.ultimo_en).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  fechaContacto(c: ContactoChat): string {
    return new Date(c.fecha).toLocaleString('es-PE', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
