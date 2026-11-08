export interface Posicion {
  lat: number;
  lng: number;
}

// Centro de Arequipa: coincide con los datos de ejemplo del schema.sql
export const POSICION_POR_DEFECTO: Posicion = { lat: -16.3989, lng: -71.535 };

export function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Pide la ubicación al navegador; si no hay permiso o falla, usa la posición por defecto. */
export function obtenerPosicion(): Promise<Posicion> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(POSICION_POR_DEFECTO);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(POSICION_POR_DEFECTO),
      { timeout: 5000 },
    );
  });
}
