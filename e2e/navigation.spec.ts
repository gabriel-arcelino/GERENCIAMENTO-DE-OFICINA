import { test, expect } from '@playwright/test';

test.describe('Navegação entre rotas', () => {
  const rotas = [
    { path: '/', heading: 'Painel de Controle' },
    { path: '/clientes', heading: 'Clientes' },
    { path: '/ordens', heading: /Ordens de Serviço|Ordens/i },
    { path: '/agenda', heading: /Agenda/i },
    { path: '/estoque', heading: /Estoque/i },
  ];

  for (const rota of rotas) {
    test(`deve carregar a rota ${rota.path} sem erros`, async ({ page }) => {
      const response = await page.goto(rota.path);

      // Verifica que a resposta HTTP é 200
      expect(response?.status()).toBe(200);

      // Verifica que o heading esperado está presente
      if (typeof rota.heading === 'string') {
        await expect(page.getByRole('heading', { name: rota.heading })).toBeVisible();
      } else {
        await expect(page.getByRole('heading', { name: rota.heading }).first()).toBeVisible();
      }
    });
  }

  test('deve navegar da home para Ordens via "Ver Todas as Ordens"', async ({ page }) => {
    await page.goto('/');

    const link = page.locator('a', { hasText: 'Ver Todas as Ordens' });
    await link.click();

    await page.waitForURL('**/ordens');
    await expect(page.getByRole('heading', { name: 'Ordens de Serviço' })).toBeVisible();
  });

  test('não deve existir erros no console da página', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(2000);

    expect(errors).toHaveLength(0);
  });
});
