export function normalizarTelefono(valor: string | null | undefined): string {
  const digitos = (valor ?? '').replace(/\D/g, '');
  return digitos.length === 9 ? `51${digitos}` : digitos;
}
