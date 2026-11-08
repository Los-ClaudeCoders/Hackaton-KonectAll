import { Injectable, inject } from '@angular/core';

import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

export interface DenunciaDatos {
  publicacionId?: string;
  mensajeId?: string;
  motivo: string;
}

@Injectable({ providedIn: 'root' })
export class ModeracionService {
  private sb = inject(SupabaseService);
  private auth = inject(AuthService);

  async denunciar(datos: DenunciaDatos): Promise<void> {
    const user = await this.auth.usuarioActual();
    if (!user) throw new Error('Inicia sesión para reportar');

    const { error } = await this.sb.client.from('denuncias').insert({
      publicacion_id: datos.publicacionId ?? null,
      mensaje_id: datos.mensajeId ?? null,
      denunciante_id: user.id,
      motivo: datos.motivo,
    });
    if (error) throw error;
  }

  async bloquear(vecinoId: string): Promise<void> {
    const user = await this.auth.usuarioActual();
    if (!user) throw new Error('Inicia sesión para bloquear');
    if (vecinoId === user.id) throw new Error('No puedes bloquearte a ti mismo');

    const { error } = await this.sb.client.from('bloqueos').insert({ bloqueante_id: user.id, bloqueado_id: vecinoId });
    if (error && error.code !== '23505') throw error;
  }

  async bloqueados(): Promise<ReadonlySet<string>> {
    const user = await this.auth.usuarioActual();
    if (!user) return new Set<string>();
    const { data } = await this.sb.client.from('bloqueos').select('bloqueado_id').eq('bloqueante_id', user.id);
    return new Set(((data ?? []) as { bloqueado_id: string }[]).map((b) => b.bloqueado_id));
  }
}
