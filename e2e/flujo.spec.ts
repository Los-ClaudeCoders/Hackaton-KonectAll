import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

const PASSWORD = 'E2eDemo123!';
const BASE = process.env['E2E_BASE_URL'] ?? 'http://localhost:4200';

const opcionesContexto = {
  baseURL: BASE,
  viewport: { width: 412, height: 915 },
  hasTouch: true,
  isMobile: true,
};

async function registrarse(page: Page, nombre: string, email: string): Promise<void> {
  await page.goto('/');
  await page.locator('app-bienvenida').getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/login\?modo=registrar$/);

  const campos = page.locator('app-login ion-input input');
  await campos.nth(0).fill(nombre);
  await campos.nth(1).fill('912345678');
  await campos.nth(2).fill('Cercado');
  await campos.nth(3).fill(email);
  await campos.nth(4).fill(PASSWORD);

  await page.locator('app-login').getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).toHaveURL(/\/tabs\/inicio$/, { timeout: 20_000 });
}

test('flujo completo entre dos vecinos', async ({ browser }) => {
  test.setTimeout(150_000);

  const semilla = Date.now();
  const titulo = `E2E ${semilla}`;
  const mensaje = `Hola, me interesa ${semilla}`;

  const contextoA = await browser.newContext(opcionesContexto);
  const contextoB = await browser.newContext(opcionesContexto);

  try {
    const pageA = await contextoA.newPage();
    const pageB = await contextoB.newPage();
    pageA.on('dialog', (dialogo) => void dialogo.accept());
    pageB.on('dialog', (dialogo) => void dialogo.accept());

    await registrarse(pageA, 'Vecino A', `e2e-a-${semilla}@example.com`);

    await pageA.getByRole('tab', { name: 'Perfil' }).click();
    await pageA.locator('app-perfil').getByRole('button', { name: 'Editar perfil' }).click();
    const camposPerfil = pageA.locator('app-perfil ion-input input');
    await camposPerfil.nth(2).fill('Paucarpata');
    await pageA.locator('app-perfil').getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(pageA.getByText('Perfil actualizado')).toBeVisible();
    await expect(pageA.locator('app-perfil').getByText('Paucarpata')).toBeVisible();

    await pageA.getByRole('tab', { name: 'Publicar' }).click();
    await pageA.locator('app-publicar').getByRole('heading', { name: 'Ofrezco' }).click();
    await pageA.locator('app-publicar ion-input input').first().fill(titulo);
    await pageA.locator('app-publicar').getByRole('button', { name: 'Publicar' }).click();
    await expect(pageA).toHaveURL(/\/tabs\/inicio$/);
    await expect(pageA.locator('app-inicio').getByRole('heading', { name: titulo })).toBeVisible();

    await registrarse(pageB, 'Vecino B', `e2e-b-${semilla}@example.com`);
    await expect(pageB.locator('app-inicio').getByRole('heading', { name: titulo })).toBeVisible();
    await pageB.locator('app-inicio').getByRole('heading', { name: titulo }).click();

    await pageB.locator('app-detalle').getByRole('button', { name: 'Recomendar' }).click();
    await expect(pageB.locator('app-detalle').getByText('Ya recomendaste')).toBeVisible();

    await pageB.locator('app-detalle').getByRole('button', { name: 'Enviar mensaje' }).click();
    await expect(pageB).toHaveURL(/\/chat\//);
    await pageB.locator('app-conversacion ion-input input').fill(mensaje);
    await pageB.locator('app-conversacion').getByRole('button', { name: 'Enviar' }).click();
    await expect(pageB.locator('app-conversacion').getByText(mensaje)).toBeVisible();

    await pageA.getByRole('tab', { name: 'Chat' }).click();
    const badge = pageA.locator('ion-tab-button[tab="chat"] ion-badge');
    await expect(badge).toHaveText('1', { timeout: 20_000 });
    await pageA.locator('app-chat').getByRole('heading', { name: titulo }).click();
    await expect(pageA.locator('app-conversacion').getByText(mensaje)).toBeVisible();
    await pageA.goBack();
    await expect(pageA).toHaveURL(/\/tabs\/chat$/);
    await expect(badge).toHaveCount(0, { timeout: 20_000 });

    await pageB.goBack();
    await pageB.locator('app-detalle').getByRole('button', { name: 'Reportar' }).click();
    await pageB.locator('ion-action-sheet').getByRole('button', { name: 'Spam' }).click();
    await expect(pageB.locator('app-detalle').getByRole('button', { name: 'Reportar' })).toHaveCount(0);

    await pageB.locator('app-detalle').getByRole('button', { name: 'Bloquear' }).click();
    await expect(pageB).toHaveURL(/\/tabs\/inicio$/);
    await expect(pageB.locator('app-inicio').getByRole('heading', { name: titulo })).toHaveCount(0, {
      timeout: 20_000,
    });

    await pageA.goto('/tabs/perfil');
    const tarjeta = pageA.locator('app-perfil ion-card').filter({ hasText: titulo });
    await tarjeta.getByRole('button', { name: 'Eliminar' }).click();
    await expect(tarjeta).toHaveCount(0, { timeout: 20_000 });
  } finally {
    await contextoA.close();
    await contextoB.close();
  }
});
