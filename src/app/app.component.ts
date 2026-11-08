import { Component, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular';

import { TemaService } from './core/tema.service';
import { transicionPagina } from './shared/animaciones';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  readonly transicionPagina = transicionPagina;

  constructor() {
    inject(TemaService);
  }
}
