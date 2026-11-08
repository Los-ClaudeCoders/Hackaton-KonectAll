import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `<span [class]="'avatar avatar--' + tamano()">{{ iniciales() }}</span>`,
  styles: [
    `
      .avatar {
        align-items: center;
        background: var(--app-avatar-bg);
        border-radius: 50%;
        color: var(--app-avatar-text);
        display: inline-flex;
        flex-shrink: 0;
        font-weight: 600;
        justify-content: center;
        letter-spacing: 0;
        text-transform: uppercase;
      }
      .avatar--sm {
        font-size: 0.7rem;
        height: 28px;
        width: 28px;
      }
      .avatar--md {
        font-size: 0.9rem;
        height: 40px;
        width: 40px;
      }
      .avatar--lg {
        font-size: 1.15rem;
        height: 56px;
        width: 56px;
      }
      .avatar--xl {
        font-size: 1.8rem;
        height: 84px;
        width: 84px;
      }
    `,
  ],
})
export class AvatarComponent {
  readonly nombre = input('');
  readonly tamano = input<'sm' | 'md' | 'lg' | 'xl'>('md');

  readonly iniciales = computed(() => {
    const partes = this.nombre().trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return '?';
    if (partes.length === 1) return partes[0].slice(0, 2);
    return `${partes[0][0]}${partes[1][0]}`;
  });
}
