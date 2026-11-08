import type { Publicacion } from '../core/models';

import { resumirVecinos, totalRecomendaciones } from './comunidad.util';

function publicacion(autor: string, nombre: string, recomendaciones: number): Publicacion {
  return {
    id: `${autor}-1`,
    autor_id: autor,
    tipo: 'ofrezco',
    modo: 'normal',
    categoria: 'servicio',
    titulo: 'Prueba',
    urgente: false,
    lat: 0,
    lng: 0,
    estado: 'disponible',
    creado_en: '',
    perfiles: { nombre, barrio: null },
    recomendaciones: [{ count: recomendaciones }],
  };
}

describe('comunidad.util', () => {
  it('agrupa publicaciones por vecino y ordena por cantidad', () => {
    const lista = [
      publicacion('a', 'Ana', 1),
      publicacion('b', 'Luis', 0),
      { ...publicacion('a', 'Ana', 2), id: 'a-2' },
    ];
    const vecinos = resumirVecinos(lista);
    expect(vecinos.length).toBe(2);
    expect(vecinos[0].nombre).toBe('Ana');
    expect(vecinos[0].publicaciones).toBe(2);
  });

  it('suma las recomendaciones de todas las publicaciones', () => {
    expect(totalRecomendaciones([publicacion('a', 'Ana', 2), publicacion('b', 'Luis', 3)])).toBe(5);
  });
});
