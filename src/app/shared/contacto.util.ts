/** Abre WhatsApp con un mensaje prellenado. El teléfono va con código de país, ej: 51912345678 */
export function abrirWhatsApp(telefono: string | null | undefined, texto: string): void {
  if (!telefono) return;
  window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(texto)}`, '_blank');
}
