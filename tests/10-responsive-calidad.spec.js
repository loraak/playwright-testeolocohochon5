const { test, expect, contador } = require('../helpers/fixtures');
const { VIEWPORTS, L, irAlJuego } = require('../helpers/juego');

const nuevoId = contador('RESP');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);

// ---------- Pantallas: 8 tamaños x 3 comprobaciones = 24
for (const [w, h] of VIEWPORTS) {
  caso(`Formulario visible en ${w}x${h}`, 'Correo y contraseña se muestran', async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const l = await irAlJuego(page);
    await expect(l.email).toBeVisible();
    await expect(l.pass).toBeVisible();
  });
  caso(`Sin desbordamiento horizontal en ${w}x${h}`, 'El ancho del contenido no supera el de la ventana', async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await irAlJuego(page);
    const sobra = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(sobra).toBeLessThanOrEqual(1);
  });
  caso(`Botón Next alcanzable en ${w}x${h}`, 'Se puede desplazar hasta el botón y verlo', async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const l = await irAlJuego(page);
    await l.siguiente.scrollIntoViewIfNeeded();
    await expect(l.siguiente).toBeVisible();
  });
}

// ---------- Calidad, accesibilidad y rendimiento (16)
caso('Idioma declarado en la pantalla del juego', 'El elemento html tiene atributo lang', async ({ page }) => {
  await irAlJuego(page);
  await expect(page.locator('html')).toHaveAttribute('lang', /.+/);
});
caso('Imágenes con texto alternativo', 'Ninguna imagen visible carece de alt', async ({ page }) => {
  await irAlJuego(page);
  const sinAlt = await page.locator('img:visible').evaluateAll((imgs) => imgs.filter((i) => !i.hasAttribute('alt')).length);
  expect(sinAlt).toBe(0);
});
caso('Campos con etiqueta o placeholder', 'Todo input de texto visible está identificado', async ({ page }) => {
  await irAlJuego(page);
  const sinNombre = await page.locator('input[type="text"]:visible, input[type="email"]:visible, input[type="password"]:visible, input:not([type]):visible')
    .evaluateAll((els) => els.filter((e) => !e.placeholder && !e.getAttribute('aria-label') && !(e.labels && e.labels.length)).length);
  expect(sinNombre).toBe(0);
});
caso('Encabezado semántico', 'Existe al menos un h1 o h2', async ({ page }) => {
  await irAlJuego(page);
  expect(await page.locator('h1, h2').count()).toBeGreaterThanOrEqual(1);
});
caso('Enlaces con texto accesible', 'Ningún enlace visible está vacío', async ({ page }) => {
  await irAlJuego(page);
  const vacios = await page.locator('a:visible').evaluateAll((as) => as.filter((a) => !a.textContent.trim() && !a.getAttribute('aria-label') && !a.querySelector('img[alt]')).length);
  expect(vacios).toBe(0);
});
caso('Recorrido con Tab', 'Al tabular se enfoca algún campo de entrada', async ({ page }) => {
  await irAlJuego(page);
  const vistos = new Set();
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    vistos.add(await page.evaluate(() => document.activeElement && document.activeElement.tagName));
  }
  expect(vistos.has('INPUT')).toBe(true);
});
caso('Llenar la contraseña solo con teclado', 'El valor escrito se conserva', async ({ page }) => {
  const l = await irAlJuego(page);
  await l.pass.focus();
  await page.keyboard.press('Control+A'); // el campo trae un texto de ayuda; se reemplaza
  await page.keyboard.type('Teclado1');
  await expect(l.pass).toHaveValue('Teclado1');
});
caso('Tiempo de carga de /game.html', 'Carga en menos de 8 segundos', async ({ page }) => {
  const t0 = Date.now();
  await page.goto('/game.html', { waitUntil: 'load' });
  expect(Date.now() - t0).toBeLessThan(8000);
});
caso('Tamaño del DOM', 'Hay menos de 3000 elementos', async ({ page }) => {
  await irAlJuego(page);
  expect(await page.evaluate(() => document.getElementsByTagName('*').length)).toBeLessThan(3000);
});
caso('Número de peticiones de red', 'Se realizan menos de 150 peticiones', async ({ page }) => {
  let n = 0;
  page.on('request', () => n++);
  await irAlJuego(page);
  await page.waitForLoadState('networkidle').catch(() => {});
  expect(n).toBeLessThan(150);
});
caso('Errores de consola en el formulario', 'No se registran mensajes de error en consola', async ({ page }) => {
  const errores = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await irAlJuego(page);
  await page.waitForTimeout(1000);
  expect(errores).toEqual([]);
});
caso('Errores de JavaScript en el formulario', 'No hay excepciones no controladas', async ({ page }) => {
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await irAlJuego(page);
  await page.waitForTimeout(1000);
  expect(errores).toEqual([]);
});
caso('Contenido mixto', 'Ninguna petición usa http:// inseguro', async ({ page }) => {
  const inseguras = [];
  page.on('request', (r) => { if (r.url().startsWith('http://')) inseguras.push(r.url()); });
  await irAlJuego(page);
  await page.waitForLoadState('networkidle').catch(() => {});
  expect(inseguras).toEqual([]);
});
caso('Compresión de la respuesta', 'El servidor envía content-encoding', async ({ page }) => {
  const resp = await page.goto('/game.html');
  expect(resp.headers()['content-encoding']).toBeTruthy();
});
caso('Política de caché', 'La respuesta incluye cache-control', async ({ page }) => {
  const resp = await page.goto('/game.html');
  expect(resp.headers()['cache-control']).toBeTruthy();
});
caso('Favicon', 'El sitio declara un icono o responde /favicon.ico', async ({ page }) => {
  await page.goto('/');
  const declarado = await page.locator('link[rel*="icon"]').count();
  if (declarado === 0) {
    const r = await page.request.get('/favicon.ico');
    expect(r.status()).toBeLessThan(400);
  } else {
    expect(declarado).toBeGreaterThan(0);
  }
});
