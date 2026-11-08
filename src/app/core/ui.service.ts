import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class UiService {
  private toast = inject(ToastController);

  async aviso(
    mensaje: string,
    color: 'primary' | 'success' | 'warning' | 'danger' | 'medium' = 'medium',
  ): Promise<void> {
    const t = await this.toast.create({ message: mensaje, duration: 2500, position: 'bottom', color });
    await t.present();
  }
}
