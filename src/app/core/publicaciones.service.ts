import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { distanciaKm, obtenerPosicion, POSICION_POR_DEFECTO } from '../shared/geo.util';
import type { Posicion } from '../shared/geo.util';

import { AuthService } from './auth.service';
import type { NuevaPublicacion, Publicacion } from './models';
import { ModeracionService } from './moderacion.service';
import { SupabaseService } from './supabase.service';
import { UiService } from './ui.service';

const CLAVE_CACHE = 'konectall.publicaciones';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private sb = inject(SupabaseService);
  private auth = inject(AuthService);
  private moderacion = inject(ModeracionService);
  private router = inject(Router);
  private ui = inject(UiService);

  readonly publicaciones = signal<Publicacion[]>(this.leerCache());
  readonly misRecomendaciones = signal<ReadonlySet<string>>(new Set<string>());
  readonly posicion = signal<Posicion>(POSICION_POR_DEFECTO);
  readonly cargando = signal(false);

  readonly cercanas = computed(() =>
    this.publicaciones()
      .filter((p) => p.estado === 'disponible')
      .sort((a, b) => (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0)),
  );

  private canal?: RealtimeChannel;
  private posicionLista = false;

  async cargar(): Promise<void> {
    this.cargando.set(true);
    await this.ubicar();
    const bloqueados = await this.moderacion.bloqueados();
    let consulta = this.sb.client
      .from('publicaciones')
      .select('*, perfiles(nombre, barrio), recomendaciones(count)')
      .order('creado_en', { ascending: false });
    if (bloqueados.size > 0) {
      consulta = consulta.not('autor_id', 'in', `(${[...bloqueados].join(',')})`);
    }
    const { data, error } = await consulta;
    if (error) {
      this.cargando.set(false);
      throw error;
    }
    const lista = ((data ?? []) as Publicacion[]).map((p) => ({
      ...p,
      distanciaKm: distanciaKm(this.posicion().lat, this.posicion().lng, p.lat, p.lng),
    }));
    this.publicaciones.set(lista);
    this.guardarCache(lista);
    await this.cargarMisRecomendaciones();
    this.cargando.set(false);
  }

  async publicar(datos: NuevaPublicacion, foto?: File | null): Promise<void> {
    const user = await this.auth.usuarioActual();
    if (!user) throw new Error('Inicia sesión para publicar');
    const fotoUrl = foto ? await this.subirFoto(foto, user.id) : null;
    const { error } = await this.sb.client
      .from('publicaciones')
      .insert({ ...datos, autor_id: user.id, foto_url: fotoUrl });
    if (error) throw error;
    await this.cargar();
  }

  async actualizar(id: string, datos: NuevaPublicacion, foto?: File | null): Promise<void> {
    const user = await this.auth.usuarioActual();
    if (!user) throw new Error('Inicia sesión para editar');
    const cambios: Record<string, unknown> = { ...datos };
    if (foto) cambios['foto_url'] = await this.subirFoto(foto, user.id);
    const { error } = await this.sb.client.from('publicaciones').update(cambios).eq('id', id);
    if (error) throw error;
    await this.cargar();
  }

  async eliminar(id: string): Promise<void> {
    const { error } = await this.sb.client.from('publicaciones').delete().eq('id', id);
    if (error) throw error;
    await this.cargar();
  }

  async telefonoDe(publicacionId: string): Promise<string | null> {
    const { data, error } = await this.sb.client.rpc('telefono_de', { p_publicacion_id: publicacionId });
    if (error) return null;
    return (data as string | null) ?? null;
  }

  async recomendar(publicacionId: string): Promise<void> {
    const user = await this.auth.usuarioActual();
    if (!user) throw new Error('Inicia sesión para recomendar');
    const { error } = await this.sb.client
      .from('recomendaciones')
      .insert({ publicacion_id: publicacionId, vecino_id: user.id });
    if (error) throw error;
    await this.cargar();
  }

  async marcarAtendida(id: string): Promise<void> {
    const { error } = await this.sb.client.from('publicaciones').update({ estado: 'atendida' }).eq('id', id);
    if (error) throw error;
    await this.cargar();
  }

  suscribir(): void {
    if (this.canal) return;
    const recargar = (): void => {
      void this.cargar().catch(() => undefined);
    };
    this.canal = this.sb.client
      .channel('konectall-publicaciones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'publicaciones' }, (payload) => {
        recargar();
        if (payload.eventType !== 'INSERT') return;
        const nueva = payload.new as Publicacion;
        if (nueva.modo !== 'emergencia' || nueva.autor_id === this.auth.usuario()?.id) return;
        if (this.router.url.includes('/emergencia') || this.router.url === '/tabs/inicio') return;
        void this.ui.aviso('Nueva emergencia en tu barrio', 'danger');
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'recomendaciones' }, recargar)
      .subscribe();
  }

  detener(): void {
    if (!this.canal) return;
    void this.sb.client.removeChannel(this.canal);
    this.canal = undefined;
  }

  private async cargarMisRecomendaciones(): Promise<void> {
    const user = await this.auth.usuarioActual();
    if (!user) {
      this.misRecomendaciones.set(new Set<string>());
      return;
    }
    const { data } = await this.sb.client.from('recomendaciones').select('publicacion_id').eq('vecino_id', user.id);
    this.misRecomendaciones.set(new Set(((data ?? []) as { publicacion_id: string }[]).map((r) => r.publicacion_id)));
  }

  private async ubicar(): Promise<void> {
    if (this.posicionLista) return;
    this.posicion.set(await obtenerPosicion());
    this.posicionLista = true;
  }

  private async subirFoto(archivo: File, userId: string): Promise<string> {
    const extension = archivo.name.split('.').pop() ?? 'jpg';
    const ruta = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { error } = await this.sb.client.storage.from('fotos').upload(ruta, archivo, { upsert: false });
    if (error) throw error;
    return this.sb.client.storage.from('fotos').getPublicUrl(ruta).data.publicUrl;
  }

  private leerCache(): Publicacion[] {
    try {
      const crudo = localStorage.getItem(CLAVE_CACHE);
      return crudo ? (JSON.parse(crudo) as Publicacion[]) : [];
    } catch {
      return [];
    }
  }

  private guardarCache(lista: Publicacion[]): void {
    try {
      localStorage.setItem(CLAVE_CACHE, JSON.stringify(lista));
    } catch {
      // Sin espacio o modo privado: la caché es opcional.
    }
  }
}
