import { test, expect } from '@playwright/test';

test.describe('Página de Clientes', () => {
  test('deve carregar a lista de clientes', async ({ page }) => {
    await page.goto('/clientes');

    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible();
    await expect(page.getByText(/cliente\(s\) encontrado/i)).toBeVisible();
  });

  test('deve ter o botão "Novo Cliente"', async ({ page }) => {
    await page.goto('/clientes');

    const novoBotao = page.getByRole('link', { name: /Novo Cliente/i });
    await expect(novoBotao).toBeVisible();
  });

  test('deve ter campo de busca funcional', async ({ page }) => {
    await page.goto('/clientes');

    const inputBusca = page.getByLabel('Buscar clientes');
    await expect(inputBusca).toBeVisible();
  });

  test('botão "Novo Cliente" deve navegar para /clientes/novo', async ({ page }) => {
    await page.goto('/clientes');

    await page.getByRole('link', { name: /Novo Cliente/i }).click();
    await page.waitForURL('**/clientes/novo');

    await expect(page).toHaveURL(/\/clientes\/novo/);
  });
});
