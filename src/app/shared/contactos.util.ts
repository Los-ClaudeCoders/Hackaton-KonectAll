export interface ContactoChat {
  publicacion_id: string;
  titulo: string;
  autor: string;
  telefono: string;
  fecha: string;
}

const CLAVE = 'konectall.contactos';
const MAXIMO = 20;

export function leerContactos(): ContactoChat[] {
  try {
    const crudo = localStorage.getItem(CLAVE);
    return crudo ? (JSON.parse(crudo) as ContactoChat[]) : [];
  } catch {
    return [];
  }
}

export function guardarContacto(contacto: ContactoChat): void {
  try {
    const lista = leerContactos().filter((c) => c.publicacion_id !== contacto.publicacion_id);
    lista.unshift(contacto);
    localStorage.setItem(CLAVE, JSON.stringify(lista.slice(0, MAXIMO)));
  } catch {
    // Sin espacio o modo privado: el historial es opcional.
  }
}

export function borrarContactos(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // Nada que hacer.
  }
}
