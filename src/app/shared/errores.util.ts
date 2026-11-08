interface Traduccion {
  patron: RegExp;
  mensaje: string;
}

const TRADUCCIONES: Traduccion[] = [
  { patron: /invalid login credentials/i, mensaje: 'Correo o contraseña incorrectos' },
  { patron: /email not confirmed/i, mensaje: 'Confirma tu correo antes de ingresar' },
  {
    patron: /email logins are disabled/i,
    mensaje: 'El inicio de sesión por correo está deshabilitado en Supabase.',
  },
  {
    patron: /email signups are disabled/i,
    mensaje: 'El registro por correo está deshabilitado en Supabase.',
  },
  { patron: /user already registered/i, mensaje: 'Ese correo ya tiene una cuenta' },
  { patron: /password should be at least/i, mensaje: 'La contraseña debe tener al menos 6 caracteres' },
  { patron: /for security purposes/i, mensaje: 'Espera unos segundos antes de reintentar' },
  { patron: /failed to fetch|networkerror|load failed/i, mensaje: 'Sin conexión. Revisa tu internet.' },
  { patron: /too many requests|rate limit/i, mensaje: 'Demasiados intentos. Espera un momento.' },
  { patron: /invalid email/i, mensaje: 'Ingresa un correo válido' },
  { patron: /signup is disabled/i, mensaje: 'El registro está deshabilitado' },
  { patron: /auth session missing|token has expired|invalid token/i, mensaje: 'El enlace expiró. Solicita uno nuevo.' },
  {
    patron: /row-level security policy|violates row-level security/i,
    mensaje: 'Límite alcanzado. Intenta de nuevo más tarde.',
  },
  { patron: /duplicate key value/i, mensaje: 'Ya registraste esta acción' },
];

export function mensajeError(error: unknown, porDefecto = 'Ocurrió un error'): string {
  const texto = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  for (const { patron, mensaje } of TRADUCCIONES) {
    if (patron.test(texto)) return mensaje;
  }
  return texto || porDefecto;
}
