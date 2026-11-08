import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonCard, IonCardContent, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline, alertCircleOutline, locationOutline, peopleOutline } from 'ionicons/icons';

const CLAVE = 'konectall.bienvenida';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [IonContent, IonCard, IonCardContent, IonButton, IonIcon],
  template: `
    <ion-content class="ion-padding">
      <div class="hero">
        <ion-icon name="people-outline" size="large" color="primary"></ion-icon>
        <h1>KonectAll</h1>
        <p>La red de tu barrio para ofrecer, encontrar y ayudarse cerca de casa.</p>
      </div>

      <ion-card class="paso">
        <ion-card-content>
          <ion-icon name="add-circle-outline"></ion-icon>
          <div>
            <h2>Publica en 3 toques</h2>
            <p>Elige qué ofreces o necesitas, escribe un título y publica.</p>
          </div>
        </ion-card-content>
      </ion-card>

      <ion-card class="paso">
        <ion-card-content>
          <ion-icon name="location-outline"></ion-icon>
          <div>
            <h2>Encuentra cerca</h2>
            <p>Servicios, productos e intercambios ordenados por distancia.</p>
          </div>
        </ion-card-content>
      </ion-card>

      <ion-card class="paso">
        <ion-card-content>
          <ion-icon name="alert-circle-outline"></ion-icon>
          <div>
            <h2>Modo emergencia</h2>
            <p>Pide u ofrece ayuda urgente y llama a los servicios de la ciudad.</p>
          </div>
        </ion-card-content>
      </ion-card>

      <ion-button expand="block" size="large" (click)="explorar()">
        {{ repaso() ? 'Volver al inicio' : 'Explorar sin cuenta' }}
      </ion-button>

      @if (!repaso()) {
        <ion-button expand="block" fill="outline" (click)="crearCuenta()">Crear cuenta</ion-button>
      }

      <p class="dato">Puedes repetir este tutorial desde Mi perfil.</p>
    </ion-content>
  `,
  styles: [
    `
      .hero {
        text-align: center;
        padding: 24px 0 8px;
      }
      .hero h1 {
        margin: 8px 0 4px;
        font-size: 2rem;
        font-weight: 800;
      }
      .hero p {
        color: var(--ion-color-medium);
        margin-top: 0;
      }
      .paso ion-card-content {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }
      .paso ion-icon {
        font-size: 28px;
        color: var(--ion-color-primary);
        flex-shrink: 0;
      }
      .paso h2 {
        margin: 0 0 4px;
        font-size: 1.05rem;
      }
      .paso p {
        margin: 0;
        color: var(--ion-color-medium);
      }
      .dato {
        text-align: center;
        color: var(--ion-color-medium);
        font-size: 0.85rem;
        margin-top: 24px;
      }
    `,
  ],
})
export class BienvenidaPage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly repaso = signal(false);

  constructor() {
    addIcons({ peopleOutline, addCircleOutline, locationOutline, alertCircleOutline });
    this.repaso.set(this.route.snapshot.queryParamMap.get('repaso') === '1');
  }

  ngOnInit(): void {
    if (!this.repaso() && this.vioTutorial()) {
      void this.router.navigateByUrl('/tabs/inicio', { replaceUrl: true });
    }
  }

  explorar(): void {
    this.marcarVisto();
    void this.router.navigateByUrl('/tabs/inicio');
  }

  crearCuenta(): void {
    this.marcarVisto();
    void this.router.navigate(['/login'], { queryParams: { modo: 'registrar' } });
  }

  private vioTutorial(): boolean {
    try {
      return localStorage.getItem(CLAVE) === '1';
    } catch {
      return false;
    }
  }

  private marcarVisto(): void {
    try {
      localStorage.setItem(CLAVE, '1');
    } catch {
      // Sin almacenamiento: el tutorial se mostrará otra vez.
    }
  }
}
