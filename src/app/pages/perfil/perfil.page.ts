import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonHeader,
  IonInput,
  IonTitle,
  IonToolbar,
} from '@ionic/angular';

import { AuthService } from '../../core/auth.service';
import type { Publicacion } from '../../core/models';
import { NotificacionesService } from '../../core/notificaciones.service';
import { PublicacionesService } from '../../core/publicaciones.service';
import { SupabaseService } from '../../core/supabase.service';
import { UiService } from '../../core/ui.service';
import { etiquetaEstado, etiquetaTipo, textoPrecio } from '../../shared/catalogo.util';
import { mensajeError } from '../../shared/errores.util';
import { normalizarTelefono } from '../../shared/telefono.util';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardContent, IonChip, IonButton, IonInput],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mi perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h1>{{ nombre() }}</h1>
      <p class="dato">{{ auth.usuario()?.email }}</p>

      @if (!editandoPerfil()) {
        @if (barrio()) {
          <p class="dato">Barrio: {{ barrio() }}</p>
        }
        @if (telefono()) {
          <p class="dato">WhatsApp: {{ telefono() }}</p>
        }
        <ion-button expand="block" fill="outline" (click)="iniciarEdicion()">Editar perfil</ion-button>
      } @else {
        <ion-input
          class="campo"
          label="Nombre"
          labelPlacement="floating"
          fill="outline"
          [value]="nombreEdicion()"
          (ionInput)="nombreEdicion.set($any($event).detail.value ?? '')"
        ></ion-input>
        <ion-input
          class="campo"
          label="WhatsApp (ej: 51912345678)"
          labelPlacement="floating"
          fill="outline"
          type="tel"
          [value]="telefonoEdicion()"
          (ionInput)="telefonoEdicion.set($any($event).detail.value ?? '')"
        ></ion-input>
        <ion-input
          class="campo"
          label="Barrio (obligatorio)"
          labelPlacement="floating"
          fill="outline"
          [value]="barrioEdicion()"
          (ionInput)="barrioEdicion.set($any($event).detail.value ?? '')"
        ></ion-input>

        <ion-button expand="block" [disabled]="guardando()" (click)="guardarPerfil()">
          {{ guardando() ? 'Guardando...' : 'Guardar datos' }}
        </ion-button>
        <ion-button expand="block" fill="clear" (click)="cancelarEdicion()">Cancelar</ion-button>
      }

      <ion-card>
        <ion-card-content>
          <strong>Mi actividad</strong>
          <p>{{ misPublicaciones().length }} publicación(es)</p>
          <p>{{ recomendacionesRecibidas() }} recomendación(es) recibida(s)</p>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-content>
          <strong>Notificaciones</strong>
          <p>Recibe avisos de mensajes y emergencias.</p>
          @if (notificaciones.disponible) {
            <ion-button expand="block" fill="outline" (click)="activarNotificaciones()">
              {{ notificaciones.activas() ? 'Notificaciones activas' : 'Activar notificaciones' }}
            </ion-button>
          } @else {
            <p class="dato">Disponible en la app Android/iOS instalada.</p>
          }
        </ion-card-content>
      </ion-card>

      @for (p of misPublicaciones(); track p.id) {
        <ion-card>
          <ion-card-content>
            <ion-chip color="primary" outline>{{ etiquetaTipo(p.tipo) }}</ion-chip>
            <ion-chip color="medium" outline>{{ textoPrecio(p.precio) }}</ion-chip>
            <h2>{{ p.titulo }}</h2>
            <p class="dato">{{ etiquetaEstado(p.estado) }}</p>
            <div class="acciones">
              <ion-button size="small" fill="outline" (click)="editarPublicacion(p)">Editar</ion-button>
              <ion-button size="small" fill="outline" color="danger" (click)="eliminarPublicacion(p)">
                Eliminar
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      } @empty {
        <p>Todavía no has publicado nada.</p>
      }

      <ion-button expand="block" fill="clear" (click)="tutorial()">Ver tutorial</ion-button>
      <ion-button expand="block" fill="outline" color="danger" (click)="salir()"> Cerrar sesión </ion-button>
    </ion-content>
  `,
  styles: [
    `
      h1 {
        margin-bottom: 4px;
      }
      .dato {
        color: var(--ion-color-medium);
        margin: 2px 0;
      }
      .campo {
        margin-top: 12px;
      }
      .acciones {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 8px;
      }
    `,
  ],
})
export class PerfilPage {
  readonly auth = inject(AuthService);
  readonly notificaciones = inject(NotificacionesService);
  private pubs = inject(PublicacionesService);
  private sb = inject(SupabaseService);
  private ui = inject(UiService);
  private router = inject(Router);

  readonly editandoPerfil = signal(false);
  readonly guardando = signal(false);
  readonly nombreEdicion = signal('');
  readonly telefonoEdicion = signal('');
  readonly barrioEdicion = signal('');

  readonly etiquetaTipo = etiquetaTipo;
  readonly etiquetaEstado = etiquetaEstado;
  readonly textoPrecio = textoPrecio;

  readonly misPublicaciones = computed(() =>
    this.pubs.publicaciones().filter((p) => p.autor_id === this.auth.usuario()?.id),
  );

  readonly recomendacionesRecibidas = computed(() =>
    this.misPublicaciones().reduce((total, p) => total + (p.recomendaciones?.[0]?.count ?? 0), 0),
  );

  async ionViewWillEnter(): Promise<void> {
    try {
      await this.pubs.cargar();
    } catch {
      await this.ui.aviso('No se pudo cargar tu perfil', 'danger');
    }
    void this.notificaciones.registrarSiPermitido();
  }

  nombre(): string {
    return (this.auth.usuario()?.user_metadata?.['nombre'] as string | undefined) ?? 'Vecino';
  }

  telefono(): string | null {
    return (this.auth.usuario()?.user_metadata?.['telefono'] as string | undefined) ?? null;
  }

  barrio(): string | null {
    return (this.auth.usuario()?.user_metadata?.['barrio'] as string | undefined) ?? null;
  }

  iniciarEdicion(): void {
    this.nombreEdicion.set(this.nombre());
    this.telefonoEdicion.set(this.telefono() ?? '');
    this.barrioEdicion.set(this.barrio() ?? '');
    this.editandoPerfil.set(true);
  }

  cancelarEdicion(): void {
    this.editandoPerfil.set(false);
  }

  async guardarPerfil(): Promise<void> {
    const nombre = this.nombreEdicion().trim();
    const telefono = normalizarTelefono(this.telefonoEdicion());
    const barrio = this.barrioEdicion().trim();
    if (!nombre) {
      await this.ui.aviso('Ingresa tu nombre', 'danger');
      return;
    }
    if (telefono.length < 9 || telefono.length > 15) {
      await this.ui.aviso('Ingresa un teléfono WhatsApp válido', 'danger');
      return;
    }
    if (!barrio) {
      await this.ui.aviso('Ingresa tu barrio', 'danger');
      return;
    }
    const user = await this.auth.usuarioActual();
    if (!user) {
      await this.router.navigateByUrl('/login');
      return;
    }

    this.guardando.set(true);
    try {
      const { error: perfilError } = await this.sb.client
        .from('perfiles')
        .upsert({ id: user.id, nombre, telefono, barrio: barrio || null }, { onConflict: 'id' });
      if (perfilError) throw perfilError;

      const { data, error } = await this.sb.client.auth.updateUser({
        data: { nombre, telefono, barrio: barrio || null },
      });
      if (error) throw error;
      if (data.user) this.auth.usuario.set(data.user);

      await this.pubs.cargar();
      this.editandoPerfil.set(false);
      await this.ui.aviso('Perfil actualizado', 'success');
    } catch (e) {
      await this.ui.aviso(mensajeError(e, 'No se pudo actualizar el perfil'), 'danger');
    } finally {
      this.guardando.set(false);
    }
  }

  editarPublicacion(p: Publicacion): void {
    void this.router.navigate(['/tabs/publicar'], { queryParams: { editar: p.id } });
  }

  async eliminarPublicacion(p: Publicacion): Promise<void> {
    if (!window.confirm(`¿Eliminar "${p.titulo}"? Esta acción no se puede deshacer.`)) return;
    try {
      await this.pubs.eliminar(p.id);
      await this.ui.aviso('Publicación eliminada', 'success');
    } catch (e) {
      await this.ui.aviso(mensajeError(e, 'No se pudo eliminar la publicación'), 'danger');
    }
  }

  async activarNotificaciones(): Promise<void> {
    await this.notificaciones.activar();
  }

  tutorial(): void {
    void this.router.navigate(['/bienvenida'], { queryParams: { repaso: 1 } });
  }

  async salir(): Promise<void> {
    await this.notificaciones.desactivar();
    await this.auth.salir();
    await this.router.navigateByUrl('/tabs/inicio');
  }
}
