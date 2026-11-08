import type { OnDestroy } from '@angular/core';
import { Component, ViewChild, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, ellipsisHorizontal, sendOutline } from 'ionicons/icons';

import { AuthService } from '../../core/auth.service';
import { MensajesService } from '../../core/mensajes.service';
import type { Mensaje } from '../../core/models';
import { ModeracionService } from '../../core/moderacion.service';
import { UiService } from '../../core/ui.service';
import { mensajeError } from '../../shared/errores.util';
import { AvatarComponent } from '../../shared/ui/avatar.component';

@Component({
  selector: 'app-conversacion',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonFooter,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    AvatarComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/chat"></ion-back-button>
        </ion-buttons>
        <ion-title>
          <div class="titulo-chat">
            <app-avatar [nombre]="otroNombre()" tamano="sm"></app-avatar>
            <span>{{ otroNombre() }}</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="mas()" aria-label="Más opciones">
            <ion-icon slot="icon-only" name="ellipsis-horizontal"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <p class="sobre">{{ titulo() }}</p>

      @if (cargando()) {
        <div class="centrado"><ion-spinner></ion-spinner></div>
      }

      @for (m of mensajes(); track m.id) {
        <div class="mensaje" [class.mio]="esMio(m)">
          <p class="burbuja">{{ m.texto }}</p>
          <span class="hora">{{ fecha(m) }}</span>
        </div>
      } @empty {
        @if (!cargando()) {
          <div class="vacio-chat">
            <ion-icon name="chatbubbles-outline"></ion-icon>
            <p>Escribe el primer mensaje a {{ otroNombre() }}.</p>
          </div>
        }
      }
    </ion-content>

    <ion-footer>
      <ion-toolbar class="barra">
        <div class="enviar">
          <ion-input
            fill="outline"
            placeholder="Escribe un mensaje"
            maxlength="1000"
            [value]="texto()"
            (ionInput)="texto.set($any($event).detail.value ?? '')"
            (keyup.enter)="enviar()"
          ></ion-input>
          <ion-button class="boton-enviar" [disabled]="enviando() || !texto().trim()" (click)="enviar()">
            <ion-icon slot="start" name="send-outline"></ion-icon>
            Enviar
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [
    `
      .titulo-chat {
        align-items: center;
        display: flex;
        gap: 8px;
      }
      .titulo-chat span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .sobre {
        color: var(--app-muted);
        font-size: 0.75rem;
        margin: 0 0 14px;
        text-align: center;
      }
      .centrado {
        padding: 24px;
        text-align: center;
      }
      .mensaje {
        align-items: flex-start;
        display: flex;
        flex-direction: column;
        margin: 8px 0;
      }
      .mensaje.mio {
        align-items: flex-end;
      }
      .burbuja {
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: 16px 16px 16px 4px;
        margin: 0;
        max-width: 78%;
        padding: 9px 12px;
        white-space: pre-wrap;
      }
      .mio .burbuja {
        background: var(--ion-color-primary);
        border-color: transparent;
        border-radius: 16px 16px 4px 16px;
        color: var(--ion-color-primary-contrast);
      }
      .hora {
        color: var(--app-muted);
        font-size: 0.65rem;
        margin-top: 3px;
      }
      .vacio-chat {
        align-items: center;
        color: var(--app-muted);
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 32px 16px;
        text-align: center;
      }
      .vacio-chat ion-icon {
        font-size: 34px;
      }
      .vacio-chat p {
        font-size: 0.85rem;
        margin: 0;
      }
      .barra {
        --background: var(--app-surface);
        border-top: 1px solid var(--app-border);
        padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
      }
      .enviar {
        align-items: center;
        display: flex;
        gap: 8px;
      }
      .enviar ion-input {
        flex: 1;
      }
      .boton-enviar {
        --border-radius: 12px;
        height: 40px;
      }
    `,
  ],
})
export class ConversacionPage implements OnDestroy {
  readonly publicacionId = input.required<string>();
  readonly vecinoId = input.required<string>();

  private mensajesService = inject(MensajesService);
  private moderacion = inject(ModeracionService);
  private auth = inject(AuthService);
  private sheet = inject(ActionSheetController);
  private ui = inject(UiService);
  private router = inject(Router);

  @ViewChild(IonContent) private contenido?: IonContent;

  readonly mensajes = signal<Mensaje[]>([]);
  readonly texto = signal('');
  readonly titulo = signal('Conversación');
  readonly otroNombre = signal('Vecino');
  readonly cargando = signal(true);
  readonly enviando = signal(false);

  constructor() {
    addIcons({ chatbubblesOutline, ellipsisHorizontal, sendOutline });
  }

  async ionViewWillEnter(): Promise<void> {
    const resumen = await this.mensajesService.resumen(this.publicacionId(), this.vecinoId());
    this.titulo.set(resumen.titulo);
    this.otroNombre.set(resumen.otroNombre);
    await this.cargar();
    this.mensajesService.suscribir(() => void this.cargar(), this.publicacionId());
  }

  ionViewWillLeave(): void {
    this.mensajesService.detener();
  }

  ngOnDestroy(): void {
    this.mensajesService.detener();
  }

  async cargar(): Promise<void> {
    try {
      this.mensajes.set(await this.mensajesService.mensajesDe(this.publicacionId(), this.vecinoId()));
      await this.mensajesService.marcarLeidos(this.publicacionId(), this.vecinoId());
      setTimeout(() => void this.contenido?.scrollToBottom(200), 50);
    } catch (e) {
      await this.ui.aviso(mensajeError(e, 'No se pudieron cargar los mensajes'), 'danger');
    } finally {
      this.cargando.set(false);
    }
  }

  async enviar(): Promise<void> {
    const texto = this.texto().trim();
    if (!texto || this.enviando()) return;
    this.enviando.set(true);
    try {
      await this.mensajesService.enviar(this.publicacionId(), this.vecinoId(), texto);
      this.texto.set('');
      await this.cargar();
    } catch (e) {
      await this.ui.aviso(mensajeError(e, 'No se pudo enviar el mensaje'), 'danger');
    } finally {
      this.enviando.set(false);
    }
  }

  async mas(): Promise<void> {
    const hoja = await this.sheet.create({
      header: this.otroNombre(),
      buttons: [
        { text: 'Reportar conversación', handler: () => void this.reportar() },
        { text: `Bloquear a ${this.otroNombre()}`, role: 'destructive', handler: () => void this.bloquear() },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await hoja.present();
  }

  private async reportar(): Promise<void> {
    try {
      await this.moderacion.denunciar({ publicacionId: this.publicacionId(), motivo: 'Conversación inapropiada' });
      await this.ui.aviso('Gracias, revisaremos el reporte', 'success');
    } catch {
      await this.ui.aviso('Ya reportaste esta conversación', 'warning');
    }
  }

  private async bloquear(): Promise<void> {
    if (!window.confirm(`¿Bloquear a ${this.otroNombre()}? No volverás a ver sus mensajes.`)) return;
    try {
      await this.moderacion.bloquear(this.vecinoId());
      await this.ui.aviso('Vecino bloqueado', 'success');
      await this.router.navigateByUrl('/tabs/chat');
    } catch {
      await this.ui.aviso('No se pudo bloquear', 'danger');
    }
  }

  esMio(mensaje: Mensaje): boolean {
    return mensaje.emisor_id === this.auth.usuario()?.id;
  }

  fecha(mensaje: Mensaje): string {
    return new Date(mensaje.creado_en).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
