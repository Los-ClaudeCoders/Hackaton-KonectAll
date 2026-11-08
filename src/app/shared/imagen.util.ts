const LADO_MAXIMO = 1280;
const CALIDAD = 0.8;
const TAMANO_MINIMO = 300 * 1024;

function cargarImagen(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imagen = new Image();
    imagen.onload = () => resolve(imagen);
    imagen.onerror = () => reject(new Error('No se pudo leer la imagen'));
    imagen.src = url;
  });
}

/** Reduce la foto antes de subirla. Si algo falla, devuelve el archivo original. */
export async function comprimirImagen(archivo: File): Promise<File> {
  if (!archivo.type.startsWith('image/') || archivo.type === 'image/gif' || archivo.size <= TAMANO_MINIMO) {
    return archivo;
  }

  const url = URL.createObjectURL(archivo);
  try {
    const imagen = await cargarImagen(url);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
    if (escala === 1 && archivo.size <= 1024 * 1024) return archivo;

    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    const contexto = lienzo.getContext('2d');
    if (!contexto) return archivo;

    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, lienzo.width, lienzo.height);
    contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

    const blob = await new Promise<Blob | null>((resolve) => lienzo.toBlob(resolve, 'image/jpeg', CALIDAD));
    if (!blob || blob.size >= archivo.size) return archivo;

    const nombre = `${archivo.name.replace(/\.[^.]+$/, '')}.jpg`;
    return new File([blob], nombre, { type: 'image/jpeg' });
  } catch {
    return archivo;
  } finally {
    URL.revokeObjectURL(url);
  }
}
