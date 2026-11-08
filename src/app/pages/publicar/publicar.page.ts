import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonImg,
  IonInput,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonTextarea,
  IonTitle,
  IonToggle,
  IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, handLeftOutline, searchOutline, swapHorizontalOutline } from 'ionicons/icons';

import type { ModoPublicacion, NuevaPublicacion, TipoPublicacion } from '../../core/models';
import { PublicacionesService } from '../../core/publicaciones.service';
import { UiService } from '../../core/ui.service';
import { mensajeError } from '../../shared/errores.util';
import { obtenerPosicion, POSICION_POR_DEFECTO } from '../../shared/geo.util';
import type { Posicion } from '../../shared/geo.util';
import { geocodificar } from '../../shared/geocodificar.util';
import { comprimirImagen } from '../../shared/imagen.util';

const LIMITE_FOTO = 5 * 1024 * 1024;

@Component({
  selector: 'app-publicar',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonCard,
    IonCardContent,
    IonIcon,
    IonImg,
    IonInput,
    IonItem,
    IonLabel,
    IonSegment,
    IonSegmentButton,
    IonTextarea,
    IonToggle,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>{{ editando() ? 'Editar publicación' : 'Publicar' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (!editando()) {
        <div class="pasos">
          <div class="paso" [class.activo]="!tipo()" [class.completo]="tipo()">
            <span>1</span>
            <em>Tipo</em>
          </div>
          <i class="linea" [class.completo]="tipo()"></i>
          <div class="paso" [class.activo]="tipo()"><span>2</span><em>Detalles</em></div>
          <i class="linea"></i>
          <div class="paso"><span>3</span><em>Publicar</em></div>
        </div>
      }

      @if (!tipo()) {
        <h2 class="titulo-paso">¿Qué deseas hacer?</h2>

        <ion-card button class="tipo tipo-ofrezco" (click)="elegirTipo('ofrezco')">
          <ion-card-content>
            <div class="tipo-icono"><ion-icon name="hand-left-outline"></ion-icon></div>
            <div class="tipo-texto">
              <h3>Ofrezco</h3>
              <p>Un producto, servicio u oficio que puedo dar.</p>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card button class="tipo tipo-necesito" (click)="elegirTipo('necesito')">
          <ion-card-content>
            <div class="tipo-icono"><ion-icon name="search-outline"></ion-icon></div>
            <div class="tipo-texto">
              <h3>Necesito</h3>
              <p>Algo que busco o una ayuda que requiero.</p>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-card button class="tipo tipo-intercambio" (click)="elegirTipo('intercambio')">
          <ion-card-content>
            <div class="tipo-icono"><ion-icon name="swap-horizontal-outline"></ion-icon></div>
            <div class="tipo-texto">
              <h3>Intercambio</h3>
              <p>Cambio algo sin dinero: objetos, conocimientos o habilidades.</p>
            </div>
          </ion-card-content>
        </ion-card>
      } @else {
        @if (modo() === 'emergencia') {
          <ion-card color="danger">
            <ion-card-content> Modo emergencia: tu publicación aparecerá en la lista de urgentes. </ion-card-content>
          </ion-card>
        }

        <ion-segment [value]="categoria()" (ionChange)="categoria.set($any($event).detail.value)">
          <ion-segment-button value="servicio">
            <ion-label>Servicio</ion-label>
          </ion-segment-button>
          <ion-segment-button value="producto">
            <ion-label>Producto</ion-label>
          </ion-segment-button>
          <ion-segment-button value="otros">
            <ion-label>Otro</ion-label>
          </ion-segment-button>
        </ion-segment>

        <ion-input
          class="campo"
          label="Título"
          labelPlacement="stacked"
          fill="outline"
          [value]="titulo()"
          (ionInput)="titulo.set($any($event).detail.value ?? '')"
        ></ion-input>

        <ion-textarea
          class="campo"
          label="Descripción"
          labelPlacement="stacked"
          fill="outline"
          [autoGrow]="true"
          [value]="descripcion()"
          (ionInput)="descripcion.set($any($event).detail.value ?? '')"
        ></ion-textarea>

        <ion-input
          class="campo"
          label="Dirección o referencia (opcional)"
          labelPlacement="stacked"
          fill="outline"
          [value]="direccion()"
          (ionInput)="direccion.set($any($event).detail.value ?? '')"
        ></ion-input>

        <ion-input
          class="campo"
          label="Precio en soles (vacío = gratis)"
          labelPlacement="stacked"
          fill="outline"
          type="number"
          inputmode="decimal"
          [value]="precioTexto()"
          (ionInput)="precioTexto.set($any($event).detail.value ?? '')"
        ></ion-input>

        <ion-item class="campo" lines="none">
          <ion-label>¿Es urgente?</ion-label>
          <ion-toggle [checked]="urgente()" (ionChange)="urgente.set($any($event).detail.checked)"></ion-toggle>
        </ion-item>

        <label class="foto-input">
          <input type="file" accept="image/*" (change)="seleccionarFoto($event)" />
          <ion-icon name="camera-outline"></ion-icon>
          <span>{{ foto()?.name ?? 'Agregar foto (opcional)' }}</span>
        </label>

        @if (fotoUrlActual() && !foto()) {
          <ion-img class="foto" [src]="fotoUrlActual() ?? ''" alt="Foto actual"></ion-img>
        }

        <p class="dato">Ubicación: usaremos tu posición actual (Arequipa si no hay permiso).</p>

        <ion-button
          class="campo"
          expand="block"
          size="large"
          [disabled]="enviando() || buscandoDireccion() || !titulo().trim()"
          (click)="publicar()"
        >
          {{
            buscandoDireccion()
              ? 'Ubicando dirección...'
              : enviando()
                ? 'Guardando...'
                : editando()
                  ? 'Guardar cambios'
                  : 'Publicar'
          }}
        </ion-button>

        <ion-button expand="block" fill="clear" (click)="tipo.set(null)"> Cambiar tipo </ion-button>
      }
    </ion-content>
  `,
  styles: [
    `
      .campo {
        margin-top: 16px;
      }
      .pasos {
        align-items: center;
        display: flex;
        justify-content: center;
        margin: 4px 0 18px;
      }
      .paso {
        align-items: center;
        color: var(--app-muted);
        display: flex;
        flex-direction: column;
        font-size: 0.68rem;
        gap: 4px;
      }
      .paso span {
        align-items: center;
        background: var(--app-surface-2);
        border-radius: 50%;
        display: flex;
        font-size: 0.78rem;
        font-weight: 600;
        height: 28px;
        justify-content: center;
        width: 28px;
      }
      .paso em {
        font-style: normal;
      }
      .paso.activo,
      .paso.completo {
        color: var(--ion-color-primary);
      }
      .paso.activo span,
      .paso.completo span {
        background: var(--ion-color-primary);
        color: var(--ion-color-primary-contrast);
      }
      .linea {
        background: var(--app-border);
        height: 2px;
        margin: 0 8px 16px;
        width: 36px;
      }
      .linea.completo {
        background: var(--ion-color-primary);
      }
      .titulo-paso {
        font-size: 1.25rem;
        font-weight: 700;
        margin: 6px 0 10px;
      }
      .tipo {
        --background: var(--tipo-suave);
        border: 0;
        box-shadow: none;
        margin: 10px 0;
      }
      .tipo ion-card-content {
        align-items: center;
        display: flex;
        gap: 12px;
        padding: 14px;
      }
      .tipo-ofrezco {
        --tipo: var(--ion-color-primary);
        --tipo-suave: rgba(var(--ion-color-primary-rgb), 0.12);
      }
      .tipo-necesito {
        --tipo: var(--ion-color-success);
        --tipo-suave: var(--cat-comunidad-soft);
      }
      .tipo-intercambio {
        --tipo: var(--cat-intercambio);
        --tipo-suave: var(--cat-intercambio-soft);
      }
      .tipo-icono {
        align-items: center;
        background: var(--app-surface);
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(15, 23, 42, 0.08);
        color: var(--tipo);
        display: flex;
        flex-shrink: 0;
        font-size: 24px;
        height: 48px;
        justify-content: center;
        width: 48px;
      }
      .tipo-texto h3 {
        font-size: 1.02rem;
        font-weight: 600;
        margin: 0 0 2px;
      }
      .tipo-texto p {
        color: var(--app-muted);
        font-size: 0.8rem;
        margin: 0;
      }
      .dato {
        color: var(--app-muted);
        font-size: 0.85rem;
      }
      .foto-input {
        align-items: center;
        border: 1.5px dashed var(--app-border);
        border-radius: 14px;
        color: var(--app-muted);
        cursor: pointer;
        display: flex;
        font-size: 0.85rem;
        gap: 10px;
        margin-top: 16px;
        padding: 14px;
      }
      .foto-input input {
        display: none;
      }
      .foto-input ion-icon {
        font-size: 22px;
      }
      .foto {
        border-radius: 12px;
        display: block;
        margin-top: 10px;
        max-height: 200px;
        max-width: 100%;
        object-fit: cover;
      }
    `,
  ],
})
export class PublicarPage {
  private pub = inject(PublicacionesService);
  private ui = inject(UiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly tipo = signal<TipoPublicacion | null>(null);
  readonly modo = signal<ModoPublicacion>('normal');
  readonly categoria = signal('servicio');
  readonly titulo = signal('');
  readonly descripcion = signal('');
  readonly direccion = signal('');
  readonly precioTexto = signal('');
  readonly urgente = signal(false);
  readonly foto = signal<File | null>(null);
  readonly enviando = signal(false);
  readonly buscandoDireccion = signal(false);
  readonly editando = signal<string | null>(null);
  readonly fotoUrlActual = signal<string | null>(null);

  readonly nombreFoto = computed(() => this.foto()?.name ?? null);

  private miPos: Posicion = POSICION_POR_DEFECTO;

  constructor() {
    addIcons({ cameraOutline, handLeftOutline, searchOutline, swapHorizontalOutline });
  }

  async ionViewWillEnter(): Promise<void> {
    const editar = this.route.snapshot.queryParamMap.get('editar');
    if (editar) {
      await this.cargarParaEditar(editar);
    } else {
      this.editando.set(null);
      this.fotoUrlActual.set(null);
      this.aplicarQuery();
    }
    this.miPos = await obtenerPosicion();
  }

  elegirTipo(tipo: TipoPublicacion): void {
    this.tipo.set(tipo);
    this.categoria.set(tipo === 'intercambio' ? 'otros' : 'servicio');
  }

  async seleccionarFoto(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    if (!archivo) return;
    if (!archivo.type.startsWith('image/') || archivo.size > LIMITE_FOTO) {
      await this.ui.aviso('Elige una imagen de máximo 5 MB', 'danger');
      input.value = '';
      return;
    }
    this.foto.set(await comprimirImagen(archivo));
  }

  async publicar(): Promise<void> {
    const tipo = this.tipo();
    const titulo = this.titulo().trim();
    if (!tipo || !titulo || this.enviando() || this.buscandoDireccion()) return;

    const precio = this.precioTexto().trim() ? Number(this.precioTexto()) : null;
    if (precio !== null && (!Number.isFinite(precio) || precio < 0)) {
      await this.ui.aviso('Ingresa un precio válido', 'danger');
      return;
    }

    let pos = this.miPos;
    const direccion = this.direccion().trim();
    if (direccion) {
      this.buscandoDireccion.set(true);
      const encontrada = await geocodificar(direccion);
      this.buscandoDireccion.set(false);
      if (encontrada) {
        pos = encontrada;
      } else {
        await this.ui.aviso('No encontramos esa dirección; usamos tu ubicación actual', 'warning');
      }
    }

    const id = this.editando();
    const datos: NuevaPublicacion = {
      tipo,
      modo: this.modo(),
      categoria: this.categoria(),
      titulo,
      descripcion: this.descripcion().trim() || null,
      precio,
      urgente: this.urgente() || this.modo() === 'emergencia',
      lat: pos.lat,
      lng: pos.lng,
    };
    if (direccion) {
      datos.direccion = direccion;
    } else if (id) {
      datos.direccion = null;
    }
    this.enviando.set(true);
    try {
      if (id) {
        await this.pub.actualizar(id, datos, this.foto());
        await this.ui.aviso('Publicación actualizada', 'success');
        this.limpiar();
        await this.router.navigateByUrl(`/publicacion/${id}`);
      } else {
        await this.pub.publicar(datos, this.foto());
        await this.ui.aviso('Publicación creada', 'success');
        this.limpiar();
        await this.router.navigateByUrl('/tabs/inicio');
      }
    } catch (e) {
      await this.ui.aviso(mensajeError(e, 'No se pudo publicar'), 'danger');
    } finally {
      this.enviando.set(false);
    }
  }

  private async cargarParaEditar(id: string): Promise<void> {
    this.editando.set(id);
    let publicacion = this.pub.publicaciones().find((p) => p.id === id);
    if (!publicacion) {
      try {
        await this.pub.cargar();
      } catch {
        // Si falla la red, se intenta con lo que ya está en memoria.
      }
      publicacion = this.pub.publicaciones().find((p) => p.id === id);
    }
    if (!publicacion) {
      this.editando.set(null);
      await this.ui.aviso('No se encontró la publicación', 'danger');
      await this.router.navigateByUrl('/tabs/perfil');
      return;
    }
    this.tipo.set(publicacion.tipo);
    this.modo.set(publicacion.modo);
    this.categoria.set(publicacion.categoria);
    this.titulo.set(publicacion.titulo);
    this.descripcion.set(publicacion.descripcion ?? '');
    this.direccion.set(publicacion.direccion ?? '');
    this.precioTexto.set(
      publicacion.precio === null || publicacion.precio === undefined ? '' : String(publicacion.precio),
    );
    this.urgente.set(publicacion.urgente);
    this.foto.set(null);
    this.fotoUrlActual.set(publicacion.foto_url ?? null);
  }

  private aplicarQuery(): void {
    const params = this.route.snapshot.queryParamMap;
    const emergencia = params.get('modo') === 'emergencia';
    this.modo.set(emergencia ? 'emergencia' : 'normal');
    this.urgente.set(emergencia || params.get('urgente') === '1');
    const tipo = params.get('tipo');
    if (tipo === 'ofrezco' || tipo === 'necesito' || tipo === 'intercambio') {
      this.elegirTipo(tipo);
    }
  }

  private limpiar(): void {
    this.tipo.set(null);
    this.modo.set('normal');
    this.categoria.set('servicio');
    this.titulo.set('');
    this.descripcion.set('');
    this.direccion.set('');
    this.precioTexto.set('');
    this.urgente.set(false);
    this.foto.set(null);
    this.editando.set(null);
    this.fotoUrlActual.set(null);
  }
}
