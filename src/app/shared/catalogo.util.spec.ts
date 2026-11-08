import { etiquetaTipo, textoPrecio } from './catalogo.util';

describe('catalogo.util', () => {
  it('muestra Gratis cuando el precio es nulo', () => {
    expect(textoPrecio(null)).toBe('Gratis');
    expect(textoPrecio(3.5)).toBe('S/ 3.50');
  });

  it('traduce los tipos de publicación', () => {
    expect(etiquetaTipo('ofrezco')).toBe('Ofrezco');
    expect(etiquetaTipo('intercambio')).toBe('Intercambio');
  });
});
