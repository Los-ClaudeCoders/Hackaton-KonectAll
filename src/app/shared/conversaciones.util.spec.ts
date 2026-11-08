import type { Mensaje, Publicacion } from '../core/models';

import { agruparConversaciones } from './conversaciones.util';

function mensaje(id: string, emisor: string, receptor: string, texto: string, fecha: string): Mensaje {
  return { id, publicacion_id: 'pub-1', emisor_id: emisor, receptor_id: receptor, texto, creado_en: fecha };
}

const PUBLICACIONES: Publicacion[] = [
  {
    id: 'pub-1',
    autor_id: 'ana',
    tipo: 'ofrezco',
    modo: 'normal',
    categoria: 'servicio',
    titulo: 'Gasfitería',
    urgente: false,
    lat: 0,
    lng: 0,
    estado: 'disponible',
    creado_en: '',
  },
  {
    id: 'pub-2',
    autor_id: 'luis',
    tipo: 'ofrezco',
    modo: 'normal',
    categoria: 'producto',
    titulo: 'Pan casero',
    urgente: false,
    lat: 0,
    lng: 0,
    estado: 'disponible',
    creado_en: '',
  },
];

describe('conversaciones.util', () => {
  it('agrupa por publicación y vecino, quedándose con el último mensaje', () => {
    const lista = [
      mensaje('m3', 'yo', 'ana', 'Último', '2026-01-03T10:00:00Z'),
      mensaje('m2', 'luis', 'yo', 'Pan', '2026-01-02T10:00:00Z'),
      mensaje('m1', 'ana', 'yo', 'Hola', '2026-01-01T10:00:00Z'),
    ];
    const conversaciones = agruparConversaciones(
      lista,
      'yo',
      [
        { id: 'ana', nombre: 'Ana' },
        { id: 'luis', nombre: 'Luis' },
      ],
      PUBLICACIONES,
    );

    expect(conversaciones.length).toBe(2);
    expect(conversaciones[0]).toMatchObject({
      publicacion_id: 'pub-1',
      otro_id: 'ana',
      otro_nombre: 'Ana',
      titulo: 'Gasfitería',
      ultimo_texto: 'Último',
    });
  });

  it('usa valores por defecto si falta el nombre o la publicación', () => {
    const conversaciones = agruparConversaciones(
      [mensaje('m1', 'yo', 'desconocido', 'Hola', '2026-01-01')],
      'yo',
      [],
      [],
    );
    expect(conversaciones[0].otro_nombre).toBe('Vecino');
    expect(conversaciones[0].titulo).toBe('Publicación');
  });
});
