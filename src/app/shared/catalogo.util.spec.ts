import { colorTipo, etiquetaTipo, textoPrecio, visualPublicacion } from './catalogo.util';

describe('catalogo.util', () => {
  it('muestra Gratis cuando el precio es nulo', () => {
    expect(textoPrecio(null)).toBe('Gratis');
    expect(textoPrecio(3.5)).toBe('S/ 3.50');
  });

  it('traduce los tipos de publicación', () => {
    expect(etiquetaTipo('ofrezco')).toBe('Ofrezco');
    expect(etiquetaTipo('intercambio')).toBe('Intercambio');
  });

  it('distingue el color de cada tipo', () => {
    expect(colorTipo('ofrezco')).toBe('primary');
    expect(colorTipo('necesito')).toBe('necesito');
    expect(colorTipo('intercambio')).toBe('tertiary');
  });

  it('colorea cada tipo y conserva el icono de categoría', () => {
    const base = { modo: 'normal' as const, categoria: 'servicio' };
    expect(visualPublicacion({ ...base, tipo: 'ofrezco' })).toEqual({
      color: 'var(--tipo-ofrezco)',
      suave: 'var(--tipo-ofrezco-soft)',
      icono: 'construct-outline',
    });
    expect(visualPublicacion({ ...base, tipo: 'necesito' }).color).toBe('var(--tipo-necesito)');
    expect(visualPublicacion({ ...base, tipo: 'intercambio' }).icono).toBe('swap-horizontal-outline');
    expect(visualPublicacion({ ...base, tipo: 'ofrezco', modo: 'emergencia' }).color).toBe('var(--cat-emergencia)');
  });
});
