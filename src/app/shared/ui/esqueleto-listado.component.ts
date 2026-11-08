import { Component, computed, input } from '@angular/core';
import { IonCard, IonCardContent, IonSkeletonText } from '@ionic/angular';

@Component({
  selector: 'app-esqueleto-listado',
  standalone: true,
  imports: [IonCard, IonCardContent, IonSkeletonText],
  template: `
    @for (fila of filasArray(); track fila) {
      <ion-card class="esqueleto">
        <div class="media"></div>
        <ion-card-content>
          <div class="autor">
            <ion-skeleton-text [animated]="true" class="avatar"></ion-skeleton-text>
            <div class="lineas">
              <ion-skeleton-text [animated]="true" class="linea corta"></ion-skeleton-text>
              <ion-skeleton-text [animated]="true" class="linea media"></ion-skeleton-text>
            </div>
          </div>
          <ion-skeleton-text [animated]="true" class="linea titulo"></ion-skeleton-text>
          <ion-skeleton-text [animated]="true" class="linea larga"></ion-skeleton-text>
        </ion-card-content>
      </ion-card>
    }
  `,
  styles: [
    `
      .esqueleto {
        margin: 12px 0;
      }
      .media {
        background: var(--app-surface-2);
        height: 120px;
      }
      .autor {
        align-items: center;
        display: flex;
        gap: 10px;
        margin-bottom: 12px;
      }
      .avatar {
        border-radius: 50%;
        height: 28px;
        width: 28px;
      }
      .lineas {
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 4px;
      }
      .linea {
        border-radius: 6px;
        height: 10px;
        margin: 0;
      }
      .corta {
        width: 35%;
      }
      .larga {
        width: 90%;
      }
      .titulo {
        height: 16px;
        width: 70%;
      }
    `,
  ],
})
export class EsqueletoListadoComponent {
  readonly filas = input(3);
  readonly filasArray = computed(() => Array.from({ length: this.filas() }, (_, i) => i));
}
