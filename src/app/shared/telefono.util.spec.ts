import { normalizarTelefono } from './telefono.util';

describe('telefono.util', () => {
  it('agrega el código de Perú a números de 9 dígitos', () => {
    expect(normalizarTelefono('912 345 678')).toBe('51912345678');
  });

  it('limpia separadores y conserva el código de país', () => {
    expect(normalizarTelefono('+51 912-345-678')).toBe('51912345678');
  });

  it('devuelve vacío si no hay dígitos', () => {
    expect(normalizarTelefono('abc')).toBe('');
  });
});
