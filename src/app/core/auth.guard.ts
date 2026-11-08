import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

import { SupabaseService } from './supabase.service';

// Espera a que Supabase recupere la sesión (evita redirigir al login al recargar la página)
export const authGuard: CanActivateFn = async (_route, state) => {
  const sb = inject(SupabaseService);
  const router = inject(Router);
  const { data } = await sb.client.auth.getSession();
  if (data.session) return true;
  return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};
