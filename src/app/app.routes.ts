import type { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'bienvenida', pathMatch: 'full' },
  {
    path: 'bienvenida',
    loadComponent: () => import('./pages/bienvenida/bienvenida.page').then((m) => m.BienvenidaPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'publicacion/:id',
    loadComponent: () => import('./pages/detalle/detalle.page').then((m) => m.DetallePage),
  },
  {
    path: 'chat/:publicacionId/:vecinoId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/conversacion/conversacion.page').then((m) => m.ConversacionPage),
  },
  {
    path: 'tabs',
    loadComponent: () => import('./tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      {
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio.page').then((m) => m.InicioPage),
      },
      {
        path: 'mapa',
        loadComponent: () => import('./pages/mapa/mapa.page').then((m) => m.MapaPage),
      },
      {
        path: 'publicar',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/publicar/publicar.page').then((m) => m.PublicarPage),
      },
      {
        path: 'chat',
        loadComponent: () => import('./pages/chat/chat.page').then((m) => m.ChatPage),
      },
      {
        path: 'perfil',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/perfil/perfil.page').then((m) => m.PerfilPage),
      },
      {
        path: 'servicios',
        loadComponent: () => import('./pages/servicios/servicios.page').then((m) => m.ServiciosPage),
      },
      {
        path: 'intercambios',
        loadComponent: () => import('./pages/intercambios/intercambios.page').then((m) => m.IntercambiosPage),
      },
      {
        path: 'emergencia',
        loadComponent: () => import('./pages/emergencia/emergencia.page').then((m) => m.EmergenciaPage),
      },
      {
        path: 'comunidad',
        loadComponent: () => import('./pages/comunidad/comunidad.page').then((m) => m.ComunidadPage),
      },
    ],
  },
  { path: '**', redirectTo: 'bienvenida' },
];
