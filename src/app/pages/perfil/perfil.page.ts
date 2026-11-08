import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonChip,
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
import { createOutline } from 'ionicons/icons';

import { AuthService } from '../../core/auth.service';
import type { Publicacion } from '../../core/models';
import { NotificacionesService } from '../../core/notificaciones.service';
import { PublicacionesService } from '../../core/publicaciones.service';
import { SupabaseService } from '../../core/supabase.service';
import { TemaService } from '../../core/tema.service';
import { UiService } from '../../core/ui.service';
import { mensajeError } from '../../shared/errores.util';
import { normalizarTelefono } from '../../shared/telefono.util';
import { AvatarComponent } from '../../shared/ui/avatar.component';
import { EstadoVacioComponent } from '../../shared/ui/estado-vacio.component';
import { PublicacionCardComponent } from '../../shared/ui/publicacion-card.component';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonChip,
    IonButton,
    IonIcon,
    IonInput,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    AvatarComponent,
    PublicacionCardComponent,
    EstadoVacioComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Mi perfil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <section class="perfil">
        <app-avatar [nombre]="nombre()" tamano="xl"></app-avatar>
        <h1>{{ nombre() }}</h1>
        <p class="dato">{{ auth.usuario()?.email }}</p>
        <div class="chips">
          @if (barrio()) {
            <ion-chip color="primary" outline>{{ barrio() }}</ion-chip>
          }
          @if (telefono()) {
            <ion-chip color="medium" outline>{{ telefono() }}</ion-chip>
          }
        </div>
        @if (!editandoPerfil()) {
          <ion-button fill="outline" (click)="iniciarEdicion()">Editar perfil</ion-button>
        }
      </section>

      @if (editandoPerfil()) {
        <ion-card class="edicion">
          <ion-card-content>
            <div class="edicion-cabecera">
              <ion-chip color="primary" outline>
                <ion-icon name="create-outline"></ion-icon>
                Editando
              </ion-chip>
              <span class="estado" [class.pendiente]="cambiosPendientes()">
                {{ cambiosPendientes() ? 'Cambios sin guardar' : 'Sin cambios' }}
              </span>
            </div>
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
              label="Localidad (obligatoria)"
              labelPlacement="floating"
              fill="outline"
              [value]="barrioEdicion()"
              (ionInput)="barrioEdicion.set($any($event).detail.value ?? '')"
            ></ion-input>

            <ion-button
              class="campo"
              expand="block"
              [disabled]="guardando() || !cambiosPendientes()"
              (click)="guardarPerfil()"
            >
              {{ guardando() ? 'Guardando...' : 'Guardar cambios' }}
            </ion-button>
            <ion-button expand="block" fill="clear" (click)="cancelarEdicion()">Cancelar</ion-button>
          </ion-card-content>
        </ion-card>
      }

      <div class="stats">
        <div class="stat">
          <strong>{{ misPublicaciones().length }}</strong>
          <span>Publicaciones</span>
        </div>
        <div class="stat">
          <strong>{{ recomendacionesRecibidas() }}</strong>
          <span>Recomendaciones</span>
        </div>
        <div class="stat">
          <strong>{{ intercambios() }}</strong>
          <span>Intercambios</span>
        </div>
      </div>

      <ion-card>
        <ion-card-content>
          <strong>Apariencia</strong>
          <ion-segment class="tema" [value]="tema.modo()" (ionChange)="tema.cambiar($any($event).detail.value)">
            <ion-segment-button value="sistema"><ion-label>Sistema</ion-label></ion-segment-button>
            <ion-segment-button value="claro"><ion-label>Claro</ion-label></ion-segment-button>
            <ion-segment-button value="oscuro"><ion-label>Oscuro</ion-label></ion-segment-button>
          </ion-segment>
        </ion-card-content>
      </ion-card>

      <ion-card>
        <ion-card-content>
          <strong>Notificaciones</strong>
          <p class="dato">Recibe avisos de mensajes y emergencias.</p>
          @if (notificaciones.disponible) {
            <ion-button expand="block" fill="outline" (click)="activarNotificaciones()">
              {{ notificaciones.activas() ? 'Notificaciones activas' : 'Activar notificaciones' }}
            </ion-button>
          } @else {
            <p class="dato">Disponible en la app Android/iOS instalada.</p>
          }
        </ion-card-content>
      </ion-card>

      <h2 class="seccion">Mis publicaciones</h2>

      @for (p of misPublicaciones(); track p.id) {
        <app-publicacion-card [publicacion]="p" [interactiva]="false" [style.--i]="$index">
          <div class="acciones">
            <ion-button size="small" fill="outline" (click)="editarPublicacion(p)">Editar</ion-button>
            <ion-button size="small" fill="outline" color="danger" (click)="eliminarPublicacion(p)">
              Eliminar
            </ion-button>
          </div>
        </app-publicacion-card>
      } @empty {
        <app-estado-vacio
          icono="file-tray-outline"
          titulo="Aún no publicaste"
          texto="Publica algo para tus vecinos y aparecerá aquí."
          accionTexto="Publicar algo"
          (accion)="irAPublicar()"
        ></app-estado-vacio>
      }

      <ion-button class="seccion" expand="block" fill="clear" (click)="tutorial()">Ver tutorial</ion-button>
      <ion-button expand="block" fill="outline" color="danger" (click)="salir()"> Cerrar sesión </ion-button>
    </ion-content>
  `,
  styles: [
    `
      .perfil {
        align-items: center;
        display: flex;
        flex-direction: column;
        padding: 8px 0 4px;
        text-align: center;
      }
      h1 {
        font-size: 1.4rem;
        font-weight: 700;
        margin: 10px 0 0;
      }
      .dato {
        color: var(--app-muted);
        font-size: 0.82rem;
        margin: 2px 0;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: center;
        margin: 8px 0 12px;
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
      .acciones {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
      }
      .campo {
        margin-top: 12px;
      }
      .tema {
        margin-top: 12px;
      }
      .edicion {
        border-color: var(--ion-color-primary);
        box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.08);
      }
      .edicion-cabecera {
        align-items: center;
        display: flex;
        gap: 8px;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .edicion-cabecera ion-chip {
        font-size: 0.75rem;
        height: 28px;
        margin: 0;
      }
      .estado {
        color: var(--app-muted);
        font-size: 0.75rem;
      }
      .estado.pendiente {
        color: var(--ion-color-primary);
        font-weight: 600;
      }
    `,
  ],
})
export class PerfilPage {
  readonly auth = inject(AuthService);
  readonly notificaciones = inject(NotificacionesService);
  readonly tema = inject(TemaService);
  private pubs = inject(PublicacionesService);
  private sb = inject(SupabaseService);
  private ui = inject(UiService);
  private router = inject(Router);

  readonly editandoPerfil = signal(false);
  readonly guardando = signal(false);
  readonly nombreEdicion = signal('');
  readonly telefonoEdicion = signal('');
  readonly barrioEdicion = signal('');

  readonly misPublicaciones = computed(() =>
    this.pubs.publicaciones().filter((p) => p.autor_id === this.auth.usuario()?.id),
  );

  readonly recomendacionesRecibidas = computed(() =>
    this.misPublicaciones().reduce((total, p) => total + (p.recomendaciones?.[0]?.count ?? 0), 0),
  );

  readonly intercambios = computed(() => this.misPublicaciones().filter((p) => p.tipo === 'intercambio').length);

  readonly cambiosPendientes = computed(() => {
    const nombre = this.nombreEdicion().trim();
    const telefono = normalizarTelefono(this.telefonoEdicion());
    const barrio = this.barrioEdicion().trim();
    return (
      nombre !== this.nombre().trim() ||
      telefono !== normalizarTelefono(this.telefono()) ||
      barrio !== (this.barrio() ?? '').trim()
    );
  });

  constructor() {
    addIcons({ createOutline });
  }

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

  async iniciarEdicion(): Promise<void> {
    this.nombreEdicion.set(this.nombre());
    this.telefonoEdicion.set(this.telefono() ?? '');
    this.barrioEdicion.set(this.barrio() ?? '');
    this.editandoPerfil.set(true);

    if (!this.telefono()) {
      const { data } = await this.sb.client.rpc('mi_telefono');
      if (typeof data === 'string' && data) this.telefonoEdicion.set(data);
    }
  }

  cancelarEdicion(): void {
    if (this.cambiosPendientes() && !window.confirm('¿Descartar los cambios?')) return;
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
      await this.ui.aviso('Ingresa tu localidad', 'danger');
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
        .update({ nombre, telefono, barrio: barrio || null })
        .eq('id', user.id);
      if (perfilError) {
        console.error('perfiles.update', perfilError);
        await this.ui.aviso(mensajeError(perfilError, 'No se pudo guardar tu perfil'), 'danger');
        return;
      }

      const { data, error } = await this.sb.client.auth.updateUser({
        data: { nombre, telefono, barrio: barrio || null },
      });
      if (error) {
        console.error('auth.updateUser', error);
        await this.ui.aviso(mensajeError(error, 'No se pudo actualizar tu cuenta'), 'danger');
        return;
      }
      if (data.user) this.auth.usuario.set(data.user);

      this.editandoPerfil.set(false);
      await this.ui.aviso('Perfil actualizado', 'success');

      try {
        await this.pubs.cargar();
      } catch (e) {
        console.error('perfil.recargar', e);
        await this.ui.aviso('Se guardó tu perfil, pero no se pudo refrescar la lista', 'warning');
      }
    } catch (e) {
      console.error('perfil', e);
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

  irAPublicar(): void {
    void this.router.navigateByUrl('/tabs/publicar');
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
