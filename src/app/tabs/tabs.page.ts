import { Component, inject } from '@angular/core';
import { IonBadge, IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, chatbubblesOutline, homeOutline, mapOutline, personOutline } from 'ionicons/icons';

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

        <ion-tab-button tab="publicar" href="/tabs/publicar">
          <ion-icon name="add-circle"></ion-icon>
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
})
export class TabsPage {
  readonly mensajes = inject(MensajesService);

  constructor() {
    addIcons({ homeOutline, mapOutline, addCircle, chatbubblesOutline, personOutline });
  }
}
