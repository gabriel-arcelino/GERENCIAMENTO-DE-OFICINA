import { test, expect } from '@playwright/test';

test.describe('Página Inicial (Dashboard)', () => {
  test('deve exibir o título principal e descrição', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Painel de Controle' })).toBeVisible();
    await expect(page.getByText('Visão geral da oficina em tempo real')).toBeVisible();
  });

  test('deve exibir os cartões de métricas principais', async ({ page }) => {
    await page.goto('/');

    const metricTitles = [
      'OS Abertas',
      'Faturamento do Mês',
      'Inadimplência',
      'Agendamentos Hoje',
    ];

    for (const title of metricTitles) {
      await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
    }
  });

  test('deve exibir seções de OS recentes e Agendamentos', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Ordens de Serviço Recentes' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Agendamentos de Hoje' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Estoque' })).toBeVisible();
  });

  test('sidebar deve estar visível com links de navegação', async ({ page }) => {
    await page.goto('/');

    const sidebar = page.locator('nav, aside').first();
    await expect(sidebar).toBeVisible();
  });
});
