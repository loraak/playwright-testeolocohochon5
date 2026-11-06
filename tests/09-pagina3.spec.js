const { test, expect, contador } = require('../helpers/fixtures');
const { L, esperarPagina, irAPagina3, sigueEnPagina, VIEWPORTS } = require('../helpers/juego');

const nuevoId = contador('P3');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);

caso('Página 3: indicador', 'Muestra "3 / 4"', async ({ page }) => {
  await irAPagina3(page);
  await esperarPagina(page, 3);
});
caso('Página 3: ya no muestra "2 / 4"', 'El indicador anterior desaparece', async ({ page }) => {
  await irAPagina3(page);
  await expect(page.locator('.page-indicator')).not.toHaveText(/2\s*\/\s*4/);
});
caso('Página 3: temporizador', 'El contador sigue visible', async ({ page }) => {
  await irAPagina3(page);
  await expect(L(page).timer).toBeVisible();
});
caso('Página 3: botón Next', 'Se muestra un botón para continuar', async ({ page }) => {
  await irAPagina3(page);
  await expect(L(page).siguiente).toBeVisible();
});
caso('Página 3: Next sin completar', 'No avanza: permanece en la página 3 de 4', async ({ page }) => {
  await irAPagina3(page);
  await L(page).siguiente.click();
  await sigueEnPagina(page, 3);
});
caso('Página 3: encabezado', 'Hay un título visible', async ({ page }) => {
  await irAPagina3(page);
  await expect(page.locator('h1, h2, h3').first()).toBeVisible();
});
caso('Página 3: elementos interactivos', 'Hay botones, enlaces o campos', async ({ page }) => {
  await irAPagina3(page);
  const n = await page.locator('button, a, input, select, textarea').count();
  expect(n).toBeGreaterThan(0);
});
caso('Página 3: enlaces o botones', 'Hay al menos un enlace o botón', async ({ page }) => {
  await irAPagina3(page);
  expect(await page.locator('a, button').count()).toBeGreaterThanOrEqual(1);
});
caso('Página 3: imágenes', 'Hay al menos una imagen', async ({ page }) => {
  await irAPagina3(page);
  expect(await page.locator('img').count()).toBeGreaterThanOrEqual(1);
});
caso('Página 3: sin errores de JavaScript en todo el recorrido', 'No hubo errores no controlados', async ({ page }) => {
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await irAPagina3(page);
  expect(errores).toEqual([]);
});
caso('Página 3: tiempo del recorrido', 'Llegar a la página 3 toma menos de 60 segundos', async ({ page }) => {
  const t0 = Date.now();
  await irAPagina3(page);
  expect(Date.now() - t0).toBeLessThan(60000);
});
caso('Página 3: título del documento', 'El título menciona "Inyerface"', async ({ page }) => {
  await irAPagina3(page);
  await expect(page).toHaveTitle(/inyerface/i);
});
caso('Página 3: URL', 'La URL conserva "game"', async ({ page }) => {
  await irAPagina3(page);
  await expect(page).toHaveURL(/game/);
});
caso('Página 3: desplazamiento al final', 'El scroll se puede realizar sin errores', async ({ page }) => {
  await irAPagina3(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('body')).toBeVisible();
});
caso('Página 3: recorrido en móvil (375x667)', 'Se llega a la página 3 de 4', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await irAPagina3(page);
});
