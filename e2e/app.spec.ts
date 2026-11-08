import { expect, test } from '@playwright/test';

test('muestra la bienvenida y entra al inicio', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'KonectAll' })).toBeVisible();
  await page.getByRole('button', { name: 'Explorar sin cuenta' }).click();

  await expect(page).toHaveURL(/\/tabs\/inicio$/);
  await expect(page.getByRole('heading', { name: 'Servicios y Productos' })).toBeVisible();
});

test('inicializa el mapa', async ({ page }) => {
  await page.goto('/tabs/mapa');

  await expect(page.locator('#konectall-mapa.leaflet-container')).toBeVisible({ timeout: 15_000 });
});

test('abre el registro desde la bienvenida', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Crear cuenta' }).click();

  await expect(page).toHaveURL(/\/login\?modo=registrar$/);
});

test('conserva el destino al pedir login', async ({ page }) => {
  const destino = '/tabs/publicar?modo=emergencia&tipo=necesito&urgente=1';
  await page.goto(destino);

  await expect(page).toHaveURL(/\/login\?redirect=/);
  expect(new URL(page.url()).searchParams.get('redirect')).toBe(destino);
});

test('filtra publicaciones por texto', async ({ page }) => {
  await page.goto('/tabs/inicio');

  await page.getByRole('searchbox').fill('gasfitería');

  await expect(page.getByText('Reparación de gasfitería')).toBeVisible();
  await expect(page.getByText('Verduras frescas del mercado')).toBeHidden();
});

test('abre secciones desde el menú Más', async ({ page }) => {
  await page.goto('/tabs/inicio');

  await page.getByRole('button', { name: 'Más secciones' }).click();
  await page.locator('ion-action-sheet').getByRole('button', { name: 'Mi comunidad' }).click();

  await expect(page).toHaveURL(/\/tabs\/comunidad$/);
});

test('sirve el manifest PWA', async ({ request }) => {
  const respuesta = await request.get('/assets/manifest.webmanifest');

  expect(respuesta.ok()).toBeTruthy();
  const manifest = (await respuesta.json()) as { name: string };
  expect(manifest.name).toBe('KonectAll');
});

test('abre una publicación desde Inicio', async ({ page }) => {
  await page.goto('/tabs/inicio');

  await page.getByRole('heading', { name: 'Reparación de gasfitería' }).click();

  await expect(page).toHaveURL(/\/publicacion\/a0000000-/);
  await expect(page.getByRole('heading', { name: 'Reparación de gasfitería' })).toBeVisible();
});

test('navega entre tabs', async ({ page }) => {
  await page.goto('/tabs/inicio');

  await page.getByRole('tab', { name: 'Mapa' }).click();

  await expect(page).toHaveURL(/\/tabs\/mapa$/);
});

test('pide login para ver el chat', async ({ page }) => {
  await page.goto('/tabs/chat');

  await expect(page.getByText('Mensajes con tus vecinos')).toBeVisible();
});

test('pide login al enviar un mensaje desde una publicación', async ({ page }) => {
  await page.goto('/publicacion/a0000000-0000-4000-8000-000000000001');

  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  await expect(page).toHaveURL(/\/login\?redirect=/);
  expect(new URL(page.url()).searchParams.get('redirect')).toBe(
    '/chat/a0000000-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111',
  );
});

test('protege la conversación sin sesión', async ({ page }) => {
  const destino = '/chat/a0000000-0000-4000-8000-000000000001/11111111-1111-4111-8111-111111111111';
  await page.goto(destino);

  await expect(page).toHaveURL(/\/login\?redirect=/);
  expect(new URL(page.url()).searchParams.get('redirect')).toBe(destino);
});

test('no expone teléfonos en las publicaciones', async ({ page }) => {
  await page.goto('/tabs/inicio');

  await expect(page.getByRole('heading', { name: 'Reparación de gasfitería' })).toBeVisible();
  expect(await page.content()).not.toContain('51958123456');
});

test('muestra acciones de moderación en el detalle', async ({ page }) => {
  await page.goto('/publicacion/a0000000-0000-4000-8000-000000000001');

  await expect(page.getByRole('button', { name: 'Reportar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bloquear' })).toBeVisible();
});
