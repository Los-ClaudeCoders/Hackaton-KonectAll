import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';

import { AuthService } from '../../core/auth.service';
import { UiService } from '../../core/ui.service';
import { mensajeError } from '../../shared/errores.util';
import { normalizarTelefono } from '../../shared/telefono.util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonInput,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  styles: [
    `
      .marca {
        margin: 8px 0 18px;
        text-align: center;
      }
      .logo {
        align-items: center;
        background: rgba(var(--ion-color-primary-rgb), 0.12);
        border-radius: 20px;
        color: var(--ion-color-primary);
        display: inline-flex;
        font-size: 34px;
        height: 64px;
        justify-content: center;
        margin-bottom: 8px;
        width: 64px;
      }
      .marca h1 {
        font-size: 1.7rem;
        font-weight: 700;
        letter-spacing: -0.02em;
        margin: 0;
      }
      .marca p {
        color: var(--app-muted);
        font-size: 0.82rem;
        margin: 4px 0 0;
      }
      .campo {
        margin-top: 16px;
      }
      .dato {
        color: var(--app-muted);
      }
    `,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-button (click)="irInicio()">Volver</ion-button>
        </ion-buttons>
        <ion-title>{{ modo() === 'ingresar' ? 'Ingresar' : 'Crear cuenta' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="marca">
        <div class="logo"><ion-icon name="people-outline"></ion-icon></div>
        <h1>KonectAll</h1>
        <p>Tu barrio, más conectado</p>
      </div>

      @if (auth.recuperando()) {
        <h2>Nueva contraseña</h2>
        <p class="dato">Elige una contraseña nueva para tu cuenta.</p>
        <ion-input
          class="campo"
          label="Nueva contraseña (mínimo 6)"
          labelPlacement="floating"
          fill="outline"
          type="password"
          [value]="nuevaPassword()"
          (ionInput)="nuevaPassword.set($any($event).detail.value ?? '')"
        ></ion-input>
        <ion-button class="campo" expand="block" [disabled]="cargando()" (click)="guardarNuevaPassword()">
          {{ cargando() ? 'Guardando...' : 'Guardar contraseña' }}
        </ion-button>
      } @else {
        <ion-segment [value]="modo()" (ionChange)="modo.set($any($event).detail.value)">
          <ion-segment-button value="ingresar"><ion-label>Ingresar</ion-label></ion-segment-button>
          <ion-segment-button value="registrar"><ion-label>Registrarme</ion-label></ion-segment-button>
        </ion-segment>

        @if (modo() === 'registrar') {
          <ion-input
            class="campo"
            label="Nombre"
            labelPlacement="floating"
            fill="outline"
            [value]="nombre()"
            (ionInput)="nombre.set($any($event).detail.value ?? '')"
          ></ion-input>
          <ion-input
            class="campo"
            label="Teléfono WhatsApp (obligatorio, ej: 51912345678)"
            labelPlacement="floating"
            fill="outline"
            type="tel"
            [value]="telefono()"
            (ionInput)="telefono.set($any($event).detail.value ?? '')"
          ></ion-input>
          <ion-input
            class="campo"
            label="Barrio (obligatorio)"
            labelPlacement="floating"
            fill="outline"
            [value]="barrio()"
            (ionInput)="barrio.set($any($event).detail.value ?? '')"
          ></ion-input>
        }

        <ion-input
          class="campo"
          label="Correo"
          labelPlacement="floating"
          fill="outline"
          type="email"
          [value]="email()"
          (ionInput)="email.set($any($event).detail.value ?? '')"
        ></ion-input>
        <ion-input
          class="campo"
          label="Contraseña (mínimo 6)"
          labelPlacement="floating"
          fill="outline"
          type="password"
          [value]="password()"
          (ionInput)="password.set($any($event).detail.value ?? '')"
        ></ion-input>

        <ion-button class="campo" expand="block" [disabled]="cargando()" (click)="enviar()">
          {{ modo() === 'ingresar' ? 'Ingresar' : 'Crear cuenta' }}
        </ion-button>

        @if (modo() === 'ingresar') {
          <ion-button class="campo" expand="block" fill="clear" (click)="recuperar()">
            ¿Olvidaste tu contraseña?
          </ion-button>
        }

        <ion-button class="campo" expand="block" fill="clear" (click)="irInicio()"> Explorar sin cuenta </ion-button>
      }
    </ion-content>
  `,
})
export class LoginPage {
  readonly auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private ui = inject(UiService);

  modo = signal<'ingresar' | 'registrar'>(
    this.route.snapshot.queryParamMap.get('modo') === 'registrar' ? 'registrar' : 'ingresar',
  );
  nombre = signal('');
  telefono = signal('');
  barrio = signal('');
  email = signal('');
  password = signal('');
  nuevaPassword = signal('');
  cargando = signal(false);

  constructor() {
    addIcons({ peopleOutline });
  }

  async enviar(): Promise<void> {
    const email = this.email().trim();
    const password = this.password();

    if (!email || password.length < 6) {
      await this.ui.aviso('Ingresa un correo y una contraseña de al menos 6 caracteres', 'danger');
      return;
    }
    if (this.modo() === 'registrar' && !this.nombre().trim()) {
      await this.ui.aviso('Ingresa tu nombre', 'danger');
      return;
    }
    const telefono = normalizarTelefono(this.telefono());
    if (this.modo() === 'registrar' && (telefono.length < 9 || telefono.length > 15)) {
      await this.ui.aviso('Ingresa tu teléfono WhatsApp (ej: 51912345678)', 'danger');
      return;
    }
    const barrio = this.barrio().trim();
    if (this.modo() === 'registrar' && !barrio) {
      await this.ui.aviso('Ingresa tu barrio', 'danger');
      return;
    }

    this.cargando.set(true);
    try {
      if (this.modo() === 'ingresar') {
        const { error } = await this.auth.ingresar(email, password);
        if (error) throw error;
        await this.irDestino();
      } else {
        const { data, error } = await this.auth.registrar(email, password, this.nombre().trim(), telefono, barrio);
        if (error) throw error;
        if (data.session) {
          await this.irDestino();
        } else {
          await this.ui.aviso('Cuenta creada. Revisa tu correo para confirmarla.', 'success');
        }
      }
    } catch (e) {
      await this.ui.aviso(mensajeError(e), 'danger');
    } finally {
      this.cargando.set(false);
    }
  }

  async recuperar(): Promise<void> {
    const email = this.email().trim();
    if (!email) {
      await this.ui.aviso('Escribe tu correo para enviarte el enlace', 'warning');
      return;
    }
    this.cargando.set(true);
    try {
      await this.auth.recuperar(email);
      await this.ui.aviso('Te enviamos un enlace para restablecer tu contraseña', 'success');
    } catch (e) {
      await this.ui.aviso(mensajeError(e, 'No se pudo enviar el enlace'), 'danger');
    } finally {
      this.cargando.set(false);
    }
  }

  async guardarNuevaPassword(): Promise<void> {
    if (this.nuevaPassword().length < 6) {
      await this.ui.aviso('La contraseña debe tener al menos 6 caracteres', 'danger');
      return;
    }
    this.cargando.set(true);
    try {
      await this.auth.actualizarPassword(this.nuevaPassword());
      await this.ui.aviso('Contraseña actualizada', 'success');
      this.nuevaPassword.set('');
      await this.router.navigateByUrl('/tabs/inicio');
    } catch (e) {
      await this.ui.aviso(mensajeError(e, 'No se pudo cambiar la contraseña'), 'danger');
    } finally {
      this.cargando.set(false);
    }
  }

  irInicio(): void {
    void this.router.navigateByUrl('/tabs/inicio');
  }

  private async irDestino(): Promise<void> {
    await this.router.navigateByUrl(this.destino());
  }

  private destino(): string {
    const destino = this.route.snapshot.queryParamMap.get('redirect');
    return destino && destino.startsWith('/') && !destino.startsWith('//') ? destino : '/tabs/inicio';
  }
}
