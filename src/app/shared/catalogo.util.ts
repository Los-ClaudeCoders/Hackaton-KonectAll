import type { EstadoPublicacion, ModoPublicacion, Publicacion, TipoPublicacion } from '../core/models';

export interface OpcionTipo {
  valor: TipoPublicacion;
  etiqueta: string;
  icono: string;
  color: string;
}

export interface OpcionCategoria {
  valor: string;
  etiqueta: string;
}

export const TIPOS: OpcionTipo[] = [
  { valor: 'ofrezco', etiqueta: 'Ofrezco', icono: 'hand-left-outline', color: 'primary' },
  { valor: 'necesito', etiqueta: 'Necesito', icono: 'search-outline', color: 'necesito' },
  {
    valor: 'intercambio',
    etiqueta: 'Intercambio',
    icono: 'swap-horizontal-outline',
    color: 'tertiary',
  },
];

export const CATEGORIAS: OpcionCategoria[] = [
  { valor: 'servicio', etiqueta: 'Servicio' },
  { valor: 'producto', etiqueta: 'Producto' },
  { valor: 'otros', etiqueta: 'Otros' },
];

export function etiquetaTipo(tipo: TipoPublicacion): string {
  return TIPOS.find((t) => t.valor === tipo)?.etiqueta ?? tipo;
}

export function colorTipo(tipo: TipoPublicacion): string {
  return TIPOS.find((t) => t.valor === tipo)?.color ?? 'medium';
}

export function etiquetaModo(modo: ModoPublicacion): string {
  return modo === 'emergencia' ? 'Emergencia' : 'Normal';
}

export function etiquetaEstado(estado: EstadoPublicacion): string {
  return estado === 'atendida' ? 'Atendida' : 'Disponible';
}

export function colorEstado(estado: EstadoPublicacion): string {
  return estado === 'atendida' ? 'medium' : 'success';
}

export function etiquetaCategoria(categoria: string): string {
  return CATEGORIAS.find((c) => c.valor === categoria)?.etiqueta ?? 'Otros';
}

export function textoPrecio(precio: number | null | undefined): string {
  return precio == null ? 'Gratis' : `S/ ${precio.toFixed(2)}`;
}

export interface VisualPublicacion {
  color: string;
  suave: string;
  icono: string;
}

/** Color e icono de una publicación según tipo, categoría y emergencia. */
export function visualPublicacion(publicacion: Pick<Publicacion, 'tipo' | 'modo' | 'categoria'>): VisualPublicacion {
  if (publicacion.modo === 'emergencia') {
    return {
      color: 'var(--cat-emergencia)',
      suave: 'var(--cat-emergencia-soft)',
      icono: 'alert-circle-outline',
    };
  }
  if (publicacion.tipo === 'intercambio') {
    return {
      color: 'var(--tipo-intercambio)',
      suave: 'var(--tipo-intercambio-soft)',
      icono: 'swap-horizontal-outline',
    };
  }
  const color =
    publicacion.tipo === 'necesito'
      ? { color: 'var(--tipo-necesito)', suave: 'var(--tipo-necesito-soft)' }
      : { color: 'var(--tipo-ofrezco)', suave: 'var(--tipo-ofrezco-soft)' };
  const icono =
    publicacion.categoria === 'producto'
      ? 'bag-handle-outline'
      : publicacion.categoria === 'servicio'
        ? 'construct-outline'
        : 'pricetag-outline';
  return { ...color, icono };
}
