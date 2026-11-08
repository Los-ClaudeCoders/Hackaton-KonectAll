import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import type { Token } from '@capacitor/push-notifications';

import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';
import { UiService } from './ui.service';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private auth = inject(AuthService);
  private sb = inject(SupabaseService);
  private ui = inject(UiService);
  private router = inject(Router);

  readonly disponible = Capacitor.isNativePlatform();
  readonly activas = signal(false);

  private iniciado = false;
  private tokenActual: string | null = null;

  iniciar(): void {
    if (this.iniciado || !this.disponible) return;
    this.iniciado = true;

    void PushNotifications.addListener('registration', (token: Token) => {
      this.tokenActual = token.value;
      this.activas.set(true);
      void this.guardarToken(token.value);
    });

    void PushNotifications.addListener('registrationError', (error) => {
      console.error('push registration', error);
    });

    void PushNotifications.addListener('pushNotificationReceived', (notificacion) => {
      void this.ui.aviso(notificacion.title ?? 'Nueva notificación', 'primary');
    });

    void PushNotifications.addListener('pushNotificationActionPerformed', (accion) => {
      const url = accion.notification.data?.['url'] as string | undefined;
      if (url) void this.router.navigateByUrl(url);
    });
  }

  async activar(): Promise<void> {
    if (!this.disponible) {
      await this.ui.aviso('Las notificaciones solo están disponibles en la app instalada', 'medium');
      return;
    }
    this.iniciar();
    const permiso = await PushNotifications.requestPermissions();
    if (permiso.receive !== 'granted') {
      await this.ui.aviso('Permiso de notificaciones denegado', 'warning');
      return;
    }
    await PushNotifications.register();
  }

  async registrarSiPermitido(): Promise<void> {
    if (!this.disponible) return;
    this.iniciar();
    const permiso = await PushNotifications.checkPermissions();
    if (permiso.receive === 'granted') {
      await PushNotifications.register();
    }
  }

  async desactivar(): Promise<void> {
    if (!this.tokenActual) return;
    await this.sb.client.from('push_tokens').delete().eq('token', this.tokenActual);
    this.tokenActual = null;
    this.activas.set(false);
  }

  private async guardarToken(token: string): Promise<void> {
    const user = await this.auth.usuarioActual();
    if (!user) return;
    const { error } = await this.sb.client.from('push_tokens').upsert(
      {
        user_id: user.id,
        token,
        plataforma: Capacitor.getPlatform(),
        actualizado_en: new Date().toISOString(),
      },
      { onConflict: 'token' },
    );
    if (error) console.error('push token', error.message);
  }
}
