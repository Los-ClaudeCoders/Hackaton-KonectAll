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
  IonSpinner,
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

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonButton, IonIcon, IonSpinner],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Chat</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (!auth.usuario()) {
        <ion-card>
          <ion-card-content>
            <strong>Mensajes con tus vecinos</strong>
            <p>Inicia sesión para conversar sobre una publicación.</p>
            <ion-button expand="block" (click)="iniciarSesion()">Iniciar sesión</ion-button>
          </ion-card-content>
        </ion-card>
      } @else {
        <h2>Conversaciones</h2>

        @if (cargando()) {
          <div class="centrado"><ion-spinner></ion-spinner></div>
        }

        @for (c of conversaciones(); track c.publicacion_id + ':' + c.otro_id) {
          <ion-card button (click)="abrir(c)">
            <ion-card-content>
              <h3>{{ c.titulo }}</h3>
              <p class="dato">{{ c.otro_nombre }} · {{ fecha(c) }}</p>
              <p class="ultimo">{{ c.ultimo_texto }}</p>
            </ion-card-content>
          </ion-card>
        } @empty {
          @if (!cargando()) {
            <ion-card>
              <ion-card-content>
                Aún no tienes conversaciones. Entra a una publicación y toca “Enviar mensaje”.
                <ion-button expand="block" fill="clear" (click)="explorar()">Ver publicaciones</ion-button>
              </ion-card-content>
            </ion-card>
          }
        }
      }

      @if (contactos().length) {
        <h2>Contactos por WhatsApp</h2>
        <ion-button fill="clear" size="small" color="medium" (click)="limpiar()">Limpiar historial</ion-button>

        @for (c of contactos(); track c.publicacion_id) {
          <ion-card>
            <ion-card-content>
              <h3>{{ c.titulo }}</h3>
              <p class="dato">{{ c.autor }} · {{ fechaContacto(c) }}</p>
              <ion-button size="small" color="success" (click)="whatsapp(c)">
                <ion-icon slot="start" name="logo-whatsapp"></ion-icon>
                WhatsApp
              </ion-button>
              <ion-button size="small" fill="clear" (click)="ver(c)">Ver publicación</ion-button>
            </ion-card-content>
          </ion-card>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      h2 {
        margin-top: 20px;
      }
      h3 {
        margin-top: 0;
      }
      .dato {
        color: var(--ion-color-medium);
      }
      .ultimo {
        margin-bottom: 0;
      }
      .centrado {
        text-align: center;
        padding: 24px;
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
