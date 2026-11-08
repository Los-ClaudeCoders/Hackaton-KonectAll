import { mensajeError } from './errores.util';

describe('errores.util', () => {
  it('traduce credenciales inválidas', () => {
    expect(mensajeError(new Error('Invalid login credentials'))).toBe('Correo o contraseña incorrectos');
  });

  it('conserva mensajes desconocidos', () => {
    expect(mensajeError(new Error('Algo raro'))).toBe('Algo raro');
  });

  it('usa el valor por defecto cuando no hay mensaje', () => {
    expect(mensajeError(null, 'Falló')).toBe('Falló');
  });

  it('traduce el límite de las políticas RLS', () => {
    expect(mensajeError(new Error('new row violates row-level security policy'))).toBe(
      'Sin permisos para esta acción o alcanzaste un límite.',
    );
  });

  it('lee el mensaje de objetos planos (no Error)', () => {
    expect(mensajeError({ message: 'permission denied for table perfiles' })).toBe('Sin permisos para esta operación.');
  });
});
