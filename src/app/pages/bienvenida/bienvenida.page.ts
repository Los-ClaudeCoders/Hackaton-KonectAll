import type { OnInit } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonButton, IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline, alertCircleOutline, locationOutline, peopleOutline } from 'ionicons/icons';

const CLAVE = 'konectall.bienvenida';

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [IonContent, IonButton, IonIcon],
  template: `
    <ion-content class="ion-padding">
      <section class="hero">
        <div class="logo"><ion-icon name="people-outline"></ion-icon></div>
        <h1>KonectAll</h1>
        <p class="lema">Tu barrio, más conectado</p>
        <p class="texto">Comparte, ayuda y encuentra lo que necesitas cerca de casa.</p>
      </section>

      <div class="pasos">
        <div class="paso">
          <div class="icono paso-publica"><ion-icon name="add-circle-outline"></ion-icon></div>
          <div class="texto-paso">
            <h2>Publica en 3 toques</h2>
            <p>Elige qué ofreces o necesitas, escribe un título y publica.</p>
          </div>
        </div>

        <div class="paso">
          <div class="icono paso-encuentra"><ion-icon name="location-outline"></ion-icon></div>
          <div class="texto-paso">
            <h2>Encuentra cerca</h2>
            <p>Servicios, productos e intercambios ordenados por distancia.</p>
          </div>
        </div>

        <div class="paso">
          <div class="icono paso-emergencia"><ion-icon name="alert-circle-outline"></ion-icon></div>
          <div class="texto-paso">
            <h2>Modo emergencia</h2>
            <p>Pide u ofrece ayuda urgente y llama a los servicios de la ciudad.</p>
          </div>
        </div>
      </div>

      <ion-button class="cta" expand="block" size="large" (click)="explorar()">
        {{ repaso() ? 'Volver al inicio' : 'Explorar sin cuenta' }}
      </ion-button>

      @if (!repaso()) {
        <ion-button class="secundario" expand="block" fill="outline" (click)="crearCuenta()"> Crear cuenta </ion-button>
      }

      <p class="dato">Puedes repetir este tutorial desde Mi perfil.</p>
    </ion-content>
  `,
  styles: [
    `
      .hero {
        animation: subir 0.45s ease both;
        background: linear-gradient(160deg, var(--ion-color-primary) 0%, #4f8ef7 100%);
        border-radius: 0 0 28px 28px;
        color: #ffffff;
        margin: -16px -16px 18px;
        padding: 38px 24px 32px;
        text-align: center;
      }
      .logo {
        align-items: center;
        background: rgba(255, 255, 255, 0.18);
        border-radius: 22px;
        display: inline-flex;
        height: 72px;
        justify-content: center;
        margin-bottom: 10px;
        width: 72px;
      }
      .logo ion-icon {
        color: #ffffff;
        font-size: 42px;
      }
      .hero h1 {
        color: #ffffff;
        font-size: 2.2rem;
        font-weight: 700;
        letter-spacing: -0.03em;
        margin: 0;
      }
      .lema {
        font-size: 1rem;
        font-weight: 500;
        margin: 4px 0 8px;
        opacity: 0.95;
      }
      .texto {
        font-size: 0.85rem;
        margin: 0 auto;
        max-width: 300px;
        opacity: 0.85;
      }
      .pasos {
        animation: subir 0.45s ease 0.08s both;
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 20px;
      }
      .paso {
        align-items: center;
        background: var(--app-surface);
        border: 1px solid var(--app-border);
        border-radius: var(--app-radius);
        box-shadow: var(--app-shadow);
        display: flex;
        gap: 12px;
        padding: 14px;
      }
      .icono {
        align-items: center;
        border-radius: 14px;
        display: flex;
        flex-shrink: 0;
        font-size: 24px;
        height: 48px;
        justify-content: center;
        width: 48px;
      }
      .paso-publica {
        background: rgba(var(--ion-color-primary-rgb), 0.12);
        color: var(--ion-color-primary);
      }
      .paso-encuentra {
        background: var(--cat-intercambio-soft);
        color: var(--cat-intercambio);
      }
      .paso-emergencia {
        background: var(--cat-emergencia-soft);
        color: var(--cat-emergencia);
      }
      .texto-paso h2 {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 2px;
      }
      .texto-paso p {
        color: var(--app-muted);
        font-size: 0.8rem;
        line-height: 1.35;
        margin: 0;
      }
      .cta {
        animation: subir 0.45s ease 0.16s both;
        margin-top: 4px;
      }
      .secundario {
        margin-top: 8px;
      }
      .dato {
        color: var(--app-muted);
        font-size: 0.78rem;
        margin-top: 20px;
        text-align: center;
      }
      @keyframes subir {
        from {
          opacity: 0;
          transform: translateY(12px);
        }
        to {
          opacity: 1;
          transform: none;
        }
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
