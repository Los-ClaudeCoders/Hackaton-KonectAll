export type TipoPublicacion = 'ofrezco' | 'necesito' | 'intercambio';
export type ModoPublicacion = 'normal' | 'emergencia';
export type EstadoPublicacion = 'disponible' | 'atendida';

export interface Perfil {
  id: string;
  nombre: string;
  telefono?: string | null;
  barrio?: string | null;
  creado_en?: string;
}

export type PerfilResumen = Pick<Perfil, 'nombre' | 'barrio'>;

export interface Publicacion {
  id: string;
  autor_id: string;
  tipo: TipoPublicacion;
  modo: ModoPublicacion;
  categoria: string;
  titulo: string;
  descripcion?: string | null;
  direccion?: string | null;
  foto_url?: string | null;
  precio?: number | null;
  urgente: boolean;
  lat: number;
  lng: number;
  estado: EstadoPublicacion;
  creado_en: string;

  // Relaciones y cálculos del cliente
  perfiles?: PerfilResumen | null;
  recomendaciones?: { count: number }[];
  distanciaKm?: number;
}

export interface NuevaPublicacion {
  tipo: TipoPublicacion;
  modo: ModoPublicacion;
  categoria: string;
  titulo: string;
  descripcion?: string | null;
  direccion?: string | null;
  precio?: number | null;
  urgente: boolean;
  lat: number;
  lng: number;
}

export interface Recomendacion {
  id: string;
  publicacion_id: string;
  vecino_id: string;
  creado_en: string;
}

export interface Mensaje {
  id: string;
  publicacion_id: string;
  emisor_id: string;
  receptor_id: string;
  texto: string;
  creado_en: string;
}

export interface ConversacionResumen {
  publicacion_id: string;
  otro_id: string;
  otro_nombre: string;
  titulo: string;
  ultimo_texto: string;
  ultimo_en: string;
}
