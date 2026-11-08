import { Component, inject } from '@angular/core';
import { IonBadge, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, chatbubblesOutline, homeOutline, mapOutline, personOutline } from 'ionicons/icons';

import { MensajesService } from '../core/mensajes.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
  template: `
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>

      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="inicio" href="/tabs/inicio">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Inicio</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="mapa" href="/tabs/mapa">
          <ion-icon name="map-outline"></ion-icon>
          <ion-label>Mapa</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="publicar" class="tab-publicar" href="/tabs/publicar">
          <ion-icon name="add"></ion-icon>
          <ion-label>Publicar</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="chat" href="/tabs/chat">
          <ion-icon name="chatbubbles-outline"></ion-icon>
          <ion-label>Chat</ion-label>
          @if (mensajes.noLeidos() > 0) {
            <ion-badge color="danger">{{ mensajes.noLeidos() }}</ion-badge>
          }
        </ion-tab-button>

        <ion-tab-button tab="perfil" href="/tabs/perfil">
          <ion-icon name="person-outline"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [
    `
      ion-tab-button.tab-publicar {
        --padding-start: 0;
        --padding-end: 0;
      }

      ion-tab-button.tab-publicar ion-icon {
        background: var(--ion-color-primary);
        border-radius: 999px;
        box-shadow: 0 6px 14px rgba(28, 95, 214, 0.35);
        color: var(--ion-color-primary-contrast);
        display: block;
        font-size: 22px;
        height: 52px;
        margin: 0 auto;
        padding: 9px;
        width: 52px;
      }
    `,
  ],
})
export class TabsPage {
  readonly mensajes = inject(MensajesService);

  constructor() {
    addIcons({ homeOutline, mapOutline, add, chatbubblesOutline, personOutline });
  }
}
