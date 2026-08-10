import { test, expect } from '@playwright/test';

test('fluxo crítico: marcar, persistir, recarregar, editar e remover na coleção', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('section h2:has-text("Raro")')).toBeVisible();

	const cards = page.locator('[data-testid="elemental-card"]');
	await expect(cards).toHaveCount(117);

	// Marcar os três primeiros itens da listagem
	const firstCard = cards.nth(0);
	const secondCard = cards.nth(1);
	const thirdCard = cards.nth(2);

	const firstToggle = firstCard.locator('button.collection-toggle');
	const secondToggle = secondCard.locator('button.collection-toggle');
	const thirdToggle = thirdCard.locator('button.collection-toggle');

	await firstToggle.click();
	await secondToggle.click();
	await thirdToggle.click();

	await expect(firstToggle).toHaveAttribute('aria-pressed', 'true');
	await expect(secondToggle).toHaveAttribute('aria-pressed', 'true');
	await expect(thirdToggle).toHaveAttribute('aria-pressed', 'true');

	await expect(firstCard.locator('.collected-indicator')).toBeVisible();
	await expect(secondCard.locator('.collected-indicator')).toBeVisible();
	await expect(thirdCard.locator('.collected-indicator')).toBeVisible();

	// Recarregar a página e confirmar que as marcações persistiram
	await page.reload();
	await expect(page.locator('section h2:has-text("Raro")')).toBeVisible();

	await expect(firstToggle).toHaveAttribute('aria-pressed', 'true');
	await expect(secondToggle).toHaveAttribute('aria-pressed', 'true');
	await expect(thirdToggle).toHaveAttribute('aria-pressed', 'true');

	// Abrir a coleção pessoal
	await page.goto('/colecao');
	await expect(page.locator('h1, h2').filter({ hasText: /coleção/i })).toBeVisible();

	const collectionItems = page.locator('.collection-list-item');
	await expect(collectionItems).toHaveCount(3);

	// Entrar em modo de edição
	await page.getByRole('button', { name: 'Editar coleção' }).click();
	await expect(page.getByRole('button', { name: 'Encerrar edição' })).toBeVisible();

	// Remover o primeiro item
	const firstRemoveButton = collectionItems.first().locator('button.remove-button');
	await firstRemoveButton.click();

	// Confirmar que o item sumiu e a coleção reflete a remoção
	await expect(collectionItems).toHaveCount(2);

	// Encerrar edição e verificar estado final
	await page.getByRole('button', { name: 'Encerrar edição' }).click();
	await expect(page.getByRole('button', { name: 'Editar coleção' })).toBeVisible();
	await expect(collectionItems).toHaveCount(2);
});
