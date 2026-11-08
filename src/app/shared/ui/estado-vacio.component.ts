import { Component, input, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, chatbubblesOutline, fileTrayOutline, peopleOutline, searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-estado-vacio',
  standalone: true,
  imports: [IonButton, IonIcon],
  template: `
    <div class="vacio">
      <div class="circulo">
        <ion-icon [name]="icono()"></ion-icon>
      </div>
      <h3>{{ titulo() }}</h3>
      @if (texto()) {
        <p>{{ texto() }}</p>
      }
      @if (accionTexto()) {
        <ion-button fill="outline" (click)="accion.emit()">{{ accionTexto() }}</ion-button>
      }
    </div>
  `,
  styles: [
    `
      .vacio {
        align-items: center;
        color: var(--app-muted);
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 36px 24px;
        text-align: center;
      }
      .circulo {
        align-items: center;
        background: var(--app-surface-2);
        border-radius: 50%;
        display: flex;
        height: 64px;
        justify-content: center;
        margin-bottom: 6px;
        width: 64px;
      }
      ion-icon {
        color: var(--app-muted);
        font-size: 30px;
      }
      h3 {
        color: var(--app-text);
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
      }
      p {
        font-size: 0.85rem;
        margin: 0;
        max-width: 260px;
      }
      ion-button {
        margin-top: 12px;
      }
    `,
  ],
})
export class EstadoVacioComponent {
  readonly icono = input('file-tray-outline');
  readonly titulo = input('Nada por aquí');
  readonly texto = input('');
  readonly accionTexto = input('');
  readonly accion = output<void>();

  constructor() {
    addIcons({
      alertCircleOutline,
      chatbubblesOutline,
      fileTrayOutline,
      peopleOutline,
      searchOutline,
    });
  }
}
