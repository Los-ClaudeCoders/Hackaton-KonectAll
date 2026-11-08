/** Abre WhatsApp con un mensaje prellenado. El teléfono va con código de país, ej: 51912345678 */
export function abrirWhatsApp(telefono: string | null | undefined, texto: string): void {
  if (!telefono) return;
  window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`, '_blank');
}

/** Texto que se comparte de una publicación (sin número de destino). */
export function textoCompartir(titulo: string, url: string): string {
  return `Mira esto en KonectAll: "${titulo}" ${url}`;
}

/** Abre el selector de contactos de WhatsApp con la publicación prellenada. */
export function compartirPorWhatsApp(titulo: string, url: string): void {
  window.open(`https://wa.me/?text=${encodeURIComponent(textoCompartir(titulo, url))}`, '_blank');
}
