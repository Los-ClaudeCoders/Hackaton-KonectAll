import type { ConversacionResumen, Mensaje, Publicacion } from '../core/models';

interface PerfilNombre {
  id: string;
  nombre: string;
}

/** Agrupa mensajes (más recientes primero) en una fila por publicación y vecino. */
export function agruparConversaciones(
  mensajes: Mensaje[],
  usuarioId: string,
  perfiles: PerfilNombre[],
  publicaciones: Publicacion[],
): ConversacionResumen[] {
  const nombres = new Map(perfiles.map((p) => [p.id, p.nombre]));
  const titulos = new Map(publicaciones.map((p) => [p.id, p.titulo]));
  const conversaciones = new Map<string, ConversacionResumen>();

  for (const mensaje of mensajes) {
    const otroId = mensaje.emisor_id === usuarioId ? mensaje.receptor_id : mensaje.emisor_id;
    const clave = `${mensaje.publicacion_id}:${otroId}`;
    if (conversaciones.has(clave)) continue;
    conversaciones.set(clave, {
      publicacion_id: mensaje.publicacion_id,
      otro_id: otroId,
      otro_nombre: nombres.get(otroId) ?? 'Vecino',
      titulo: titulos.get(mensaje.publicacion_id) ?? 'Publicación',
      ultimo_texto: mensaje.texto,
      ultimo_en: mensaje.creado_en,
    });
  }

  return [...conversaciones.values()];
}
