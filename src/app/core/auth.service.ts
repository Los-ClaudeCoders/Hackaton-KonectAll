import { Injectable, inject, signal } from '@angular/core';
import type { AuthResponse, User } from '@supabase/supabase-js';

import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private sb = inject(SupabaseService);

  usuario = signal<User | null>(null);
  listo = signal(false);
  recuperando = signal(false);

  constructor() {
    if (window.location.hash.includes('type=recovery')) this.recuperando.set(true);
    this.sb.client.auth.getSession().then(({ data }) => {
      this.usuario.set(data.session?.user ?? null);
      this.listo.set(true);
    });
    this.sb.client.auth.onAuthStateChange((evento, sesion) => {
      this.usuario.set(sesion?.user ?? null);
      if (evento === 'PASSWORD_RECOVERY') this.recuperando.set(true);
    });
  }

  registrar(
    email: string,
    password: string,
    nombre: string,
    telefono?: string,
    barrio?: string,
  ): Promise<AuthResponse> {
    return this.sb.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre,
          telefono: telefono || null,
          barrio: barrio || null,
        },
      },
    });
  }

  ingresar(email: string, password: string): Promise<AuthResponse> {
    return this.sb.client.auth.signInWithPassword({ email, password });
  }

  async recuperar(email: string): Promise<void> {
    const { error } = await this.sb.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  }

  async actualizarPassword(password: string): Promise<void> {
    const { error } = await this.sb.client.auth.updateUser({ password });
    if (error) throw error;
    this.recuperando.set(false);
  }

  async salir(): Promise<void> {
    this.recuperando.set(false);
    await this.sb.client.auth.signOut();
  }

  /** Devuelve el usuario con sesión activa (o null). */
  async usuarioActual(): Promise<User | null> {
    const { data } = await this.sb.client.auth.getSession();
    return data.session?.user ?? null;
  }
}
