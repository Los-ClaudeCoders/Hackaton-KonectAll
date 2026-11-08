import type { Posicion } from './geo.util';

const CIUDAD = 'Arequipa, Perú';

/** Busca una dirección en OpenStreetMap (Nominatim). Devuelve null si no la encuentra. */
export async function geocodificar(direccion: string): Promise<Posicion | null> {
  const consulta = direccion.trim();
  if (!consulta) return null;

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'pe');
  url.searchParams.set('q', `${consulta}, ${CIUDAD}`);

  try {
    const respuesta = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!respuesta.ok) return null;
    const resultados = (await respuesta.json()) as { lat: string; lon: string }[];
    const primero = resultados[0];
    if (!primero) return null;
    const lat = Number(primero.lat);
    const lng = Number(primero.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}
