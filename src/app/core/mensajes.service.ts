import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { RealtimeChannel } from '@supabase/supabase-js';

import { agruparConversaciones } from '../shared/conversaciones.util';

import { AuthService } from './auth.service';
import type { ConversacionResumen, Mensaje } from './models';
import { ModeracionService } from './moderacion.service';
import { PublicacionesService } from './publicaciones.service';
import { SupabaseService } from './supabase.service';
import { UiService } from './ui.service';

@Injectable({ providedIn: 'root' })
export class MensajesService {
  private sb = inject(SupabaseService);
  private auth = inject(AuthService);
  private moderacion = inject(ModeracionService);
  private pubs = inject(PublicacionesService);
  private router = inject(Router);
  private ui = inject(UiService);

  readonly noLeidos = signal(0);

  private canal?: RealtimeChannel;
  private canalContador?: RealtimeChannel;

  constructor() {
    this.iniciarContador();
  }

  async conversaciones(): Promise<ConversacionResumen[]> {
    const user = await this.auth.usuarioActual();
    if (!user) return [];

    const bloqueados = await this.moderacion.bloqueados();
    let consulta = this.sb.client
      .from('mensajes')
      .select('*')
      .or(`emisor_id.eq.${user.id},receptor_id.eq.${user.id}`)
      .order('creado_en', { ascending: false });
    if (bloqueados.size > 0) {
      const lista = `(${[...bloqueados].join(',')})`;
      consulta = consulta.not('emisor_id', 'in', lista).not('receptor_id', 'in', lista);
    }
    const { data, error } = await consulta;
    if (error) throw error;

    const mensajes = (data ?? []) as Mensaje[];
    const otros = [...new Set(mensajes.map((m) => (m.emisor_id === user.id ? m.receptor_id : m.emisor_id)))];
    let perfiles: { id: string; nombre: string }[] = [];
    if (otros.length > 0) {
      const { data: filas } = await this.sb.client.from('perfiles').select('id, nombre').in('id', otros);
      perfiles = (filas ?? []) as { id: string; nombre: string }[];
    }

    return agruparConversaciones(mensajes, user.id, perfiles, this.pubs.publicaciones());
  }

  async mensajesDe(publicacionId: string, otroId: string): Promise<Mensaje[]> {
    const user = await this.auth.usuarioActual();
    if (!user) return [];
    const bloqueados = await this.moderacion.bloqueados();
    if (bloqueados.has(otroId)) return [];

    const { data, error } = await this.sb.client
      .from('mensajes')
      .select('*')
      .eq('publicacion_id', publicacionId)
      .or(`and(emisor_id.eq.${user.id},receptor_id.eq.${otroId}),and(emisor_id.eq.${otroId},receptor_id.eq.${user.id})`)
      .order('creado_en', { ascending: true });
    if (error) throw error;
    return (data ?? []) as Mensaje[];
  }

  async enviar(publicacionId: string, receptorId: string, texto: string): Promise<void> {
    const user = await this.auth.usuarioActual();
    if (!user) throw new Error('Inicia sesión para enviar mensajes');
    const limpio = texto.trim();
    if (!limpio) return;
    if (limpio.length > 1000) throw new Error('El mensaje es demasiado largo');

    const { error } = await this.sb.client.from('mensajes').insert({
      publicacion_id: publicacionId,
      emisor_id: user.id,
      receptor_id: receptorId,
      texto: limpio,
    });
    if (error) throw error;
  }

  async resumen(publicacionId: string, otroId: string): Promise<{ titulo: string; otroNombre: string }> {
    const [publicacion, perfil] = await Promise.all([
      this.sb.client.from('publicaciones').select('titulo').eq('id', publicacionId).maybeSingle(),
      this.sb.client.from('perfiles').select('nombre').eq('id', otroId).maybeSingle(),
    ]);
    return {
      titulo: (publicacion.data as { titulo: string } | null)?.titulo ?? 'Publicación',
      otroNombre: (perfil.data as { nombre: string } | null)?.nombre ?? 'Vecino',
    };
  }

  async marcarLeidos(publicacionId: string, otroId: string): Promise<void> {
    const user = await this.auth.usuarioActual();
    if (!user) return;
    await this.sb.client
      .from('mensajes')
      .update({ leido: true })
      .eq('publicacion_id', publicacionId)
      .eq('emisor_id', otroId)
      .eq('receptor_id', user.id)
      .eq('leido', false);
    await this.refrescarNoLeidos();
  }

  async refrescarNoLeidos(): Promise<void> {
    const user = await this.auth.usuarioActual();
    if (!user) {
      this.noLeidos.set(0);
      return;
    }
    const bloqueados = await this.moderacion.bloqueados();
    let consulta = this.sb.client
      .from('mensajes')
      .select('id', { count: 'exact', head: true })
      .eq('receptor_id', user.id)
      .eq('leido', false);
    if (bloqueados.size > 0) {
      consulta = consulta.not('emisor_id', 'in', `(${[...bloqueados].join(',')})`);
    }
    const { count } = await consulta;
    this.noLeidos.set(count ?? 0);
  }

  private iniciarContador(): void {
    this.canalContador = this.sb.client
      .channel('konectall-mensajes-contador')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes' }, (payload) => {
        const nuevo = payload.new as Mensaje | null;
        if (
          payload.eventType === 'INSERT' &&
          nuevo?.receptor_id === this.auth.usuario()?.id &&
          !this.router.url.includes('/chat')
        ) {
          void this.ui.aviso('Tienes un mensaje nuevo', 'primary');
        }
        void this.refrescarNoLeidos();
      })
      .subscribe();
    void this.refrescarNoLeidos();
    this.sb.client.auth.onAuthStateChange(() => void this.refrescarNoLeidos());
  }

  suscribir(alCambiar: () => void, publicacionId?: string): void {
    this.detener();
    const configuracion = publicacionId
      ? ({
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `publicacion_id=eq.${publicacionId}`,
        } as const)
      : ({ event: 'INSERT', schema: 'public', table: 'mensajes' } as const);
    this.canal = this.sb.client
      .channel(`konectall-mensajes-${publicacionId ?? 'todos'}`)
      .on('postgres_changes', configuracion, alCambiar)
      .subscribe();
  }

  detener(): void {
    if (!this.canal) return;
    void this.sb.client.removeChannel(this.canal);
    this.canal = undefined;
  }
}
