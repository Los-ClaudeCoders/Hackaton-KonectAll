import type { Publicacion } from '../core/models';

export interface ResumenVecino {
  autor_id: string;
  nombre: string;
  barrio: string | null;
  publicaciones: number;
}

export function resumirVecinos(publicaciones: Publicacion[]): ResumenVecino[] {
  const mapa = new Map<string, ResumenVecino>();
  for (const p of publicaciones) {
    const actual = mapa.get(p.autor_id) ?? {
      autor_id: p.autor_id,
      nombre: p.perfiles?.nombre ?? 'Vecino',
      barrio: p.perfiles?.barrio ?? null,
      publicaciones: 0,
    };
    actual.publicaciones++;
    mapa.set(p.autor_id, actual);
  }
  return [...mapa.values()].sort((a, b) => b.publicaciones - a.publicaciones);
}

export function totalRecomendaciones(publicaciones: Publicacion[]): number {
  return publicaciones.reduce((total, p) => total + (p.recomendaciones?.[0]?.count ?? 0), 0);
}
