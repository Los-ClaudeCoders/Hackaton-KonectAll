import { Injectable, signal } from '@angular/core';

export type ModoTema = 'sistema' | 'claro' | 'oscuro';

const CLAVE = 'konectall.tema';
const CONSULTA_OSCURO = '(prefers-color-scheme: dark)';

@Injectable({ providedIn: 'root' })
export class TemaService {
  readonly modo = signal<ModoTema>(this.leer());

  private readonly media = window.matchMedia(CONSULTA_OSCURO);

  constructor() {
    this.media.addEventListener('change', () => this.aplicar());
    this.aplicar();
  }

  cambiar(modo: ModoTema): void {
    this.modo.set(modo);
    try {
      localStorage.setItem(CLAVE, modo);
    } catch {
      // Sin almacenamiento: el tema se mantiene en memoria.
    }
    this.aplicar();
  }

  private aplicar(): void {
    const oscuro = this.modo() === 'oscuro' || (this.modo() === 'sistema' && this.media.matches);
    document.documentElement.classList.toggle('ion-palette-dark', oscuro);
  }

  private leer(): ModoTema {
    try {
      const valor = localStorage.getItem(CLAVE);
      if (valor === 'claro' || valor === 'oscuro' || valor === 'sistema') return valor;
    } catch {
      // Sin almacenamiento: se usa el sistema.
    }
    return 'sistema';
  }
}
