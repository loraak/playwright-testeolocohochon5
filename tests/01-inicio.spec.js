const { test, expect, contador } = require('../helpers/fixtures');
const { VIEWPORTS, L } = require('../helpers/juego');

const nuevoId = contador('INICIO');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);

caso('La página de inicio responde', 'El código HTTP es menor a 400', async ({ page }) => {
  const resp = await page.goto('/');
  expect(resp.status()).toBeLessThan(400);
});
caso('Título de la página', 'El título menciona "Inyerface"', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/inyerface/i);
});
caso('Enlace HERE visible', 'Se muestra el enlace para comenzar el juego', async ({ page }) => {
  await page.goto('/');
  await expect(L(page).aqui).toBeVisible();
});
caso('Clic en HERE', 'Se abre el formulario del juego (campo de contraseña)', async ({ page }) => {
  await page.goto('/');
  await L(page).aqui.click();
  await expect(L(page).pass).toBeVisible();
});
caso('URL tras hacer clic en HERE', 'La URL pertenece a la pantalla del juego', async ({ page }) => {
  await page.goto('/');
  await L(page).aqui.click();
  await expect(page).toHaveURL(/game/);
});

for (const [w, h] of VIEWPORTS) {
  caso(`Inicio en pantalla ${w}x${h}`, 'El enlace HERE sigue visible', async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/');
    await expect(L(page).aqui).toBeVisible();
  });
}

caso('Recargar la página de inicio', 'Tras recargar sigue mostrando HERE', async ({ page }) => {
  await page.goto('/');
  await page.reload();
  await expect(L(page).aqui).toBeVisible();
});
caso('Botón atrás desde el juego', 'Regresa a la pantalla de inicio', async ({ page }) => {
  await page.goto('/');
  await L(page).aqui.click();
  await expect(L(page).pass).toBeVisible();
  await page.goBack();
  await expect(L(page).aqui).toBeVisible();
});
caso('Errores de JavaScript al cargar', 'No se producen errores no controlados', async ({ page }) => {
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto('/');
  await page.waitForTimeout(1000);
  expect(errores).toEqual([]);
});
caso('Tiempo de carga', 'La página carga en menos de 8 segundos', async ({ page }) => {
  const t0 = Date.now();
  await page.goto('/', { waitUntil: 'load' });
  expect(Date.now() - t0).toBeLessThan(8000);
});
caso('Imágenes visibles sin romper', 'Ninguna imagen visible tiene ancho natural 0', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('load');
  const rotas = await page.locator('img:visible').evaluateAll((imgs) => imgs.filter((i) => i.naturalWidth === 0).length);
  expect(rotas).toBe(0);
});
caso('Atributo lang del documento', 'El elemento html declara un idioma', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', /.+/);
});
caso('Meta viewport', 'Existe la etiqueta meta viewport', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="viewport"]')).toHaveCount(1);
});
caso('Navegación con teclado', 'La tecla Tab enfoca un elemento de la página', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const tag = await page.evaluate(() => document.activeElement && document.activeElement.tagName);
  expect(tag).not.toBe('BODY');
});
caso('Acceso directo a /game.html', 'Carga el formulario sin pasar por el inicio', async ({ page }) => {
  const resp = await page.goto('/game.html');
  expect(resp.status()).toBeLessThan(400);
  await expect(L(page).pass).toBeVisible();
});
caso('Ruta inexistente', 'Responde 404 o muestra la página principal', async ({ page }) => {
  const resp = await page.goto('/ruta-que-no-existe-xyz');
  expect([200, 404]).toContain(resp.status());
});
caso('Tipo de contenido', 'La respuesta es text/html', async ({ page }) => {
  const resp = await page.goto('/');
  expect(resp.headers()['content-type']).toContain('text/html');
});
caso('Uso de HTTPS', 'La URL final comienza con https://', async ({ page }) => {
  await page.goto('/');
  expect(page.url().startsWith('https://')).toBe(true);
});
