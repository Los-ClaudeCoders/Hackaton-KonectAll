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
    IonInput,
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
        <ion-card>
          <ion-card-content>
            <strong>Editar mis datos</strong>
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

            <ion-button class="campo" expand="block" [disabled]="guardando()" (click)="guardarPerfil()">
              {{ guardando() ? 'Guardando...' : 'Guardar datos' }}
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

  readonly misPublicaciones = computed(() =>
    this.pubs.publicaciones().filter((p) => p.autor_id === this.auth.usuario()?.id),
  );

  readonly recomendacionesRecibidas = computed(() =>
    this.misPublicaciones().reduce((total, p) => total + (p.recomendaciones?.[0]?.count ?? 0), 0),
  );

  readonly intercambios = computed(() => this.misPublicaciones().filter((p) => p.tipo === 'intercambio').length);

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
