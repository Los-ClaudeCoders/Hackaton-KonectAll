import { createAnimation } from '@ionic/angular';
import type { AnimationBuilder } from '@ionic/angular';

interface OpcionesTransicion {
  enteringEl: HTMLElement;
  leavingEl?: HTMLElement;
}

/** Fade + leve desplazamiento para las páginas de nivel superior. */
export const transicionPagina: AnimationBuilder = (baseEl, opciones) => {
  const { enteringEl, leavingEl } = opciones as OpcionesTransicion;
  const reducido = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duracion = reducido ? 0 : 220;

  const raiz = createAnimation().addElement(baseEl).duration(duracion).easing('ease-out');

  if (enteringEl) {
    raiz.addAnimation(
      createAnimation()
        .addElement(enteringEl)
        .fromTo('opacity', '0', '1')
        .fromTo('transform', 'translateY(8px)', 'translateY(0)'),
    );
  }

  if (leavingEl) {
    raiz.addAnimation(createAnimation().addElement(leavingEl).fromTo('opacity', '1', '0'));
  }

  return raiz;
};
