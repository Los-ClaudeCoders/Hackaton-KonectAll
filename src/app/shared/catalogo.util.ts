import type { EstadoPublicacion, ModoPublicacion, TipoPublicacion } from '../core/models';

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
  { valor: 'ofrezco', etiqueta: 'Ofrezco', icono: 'hand-left-outline', color: 'success' },
  { valor: 'necesito', etiqueta: 'Necesito', icono: 'search-outline', color: 'warning' },
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
