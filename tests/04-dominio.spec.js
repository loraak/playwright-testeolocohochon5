const { test, expect, contador } = require('../helpers/fixtures');
const { L, irAlJuego, completarPagina1, sigueEnPagina, esperarPagina, corto } = require('../helpers/juego');

const nuevoId = contador('DOM');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);
const abrir = async (page) => { await irAlJuego(page); return L(page); };

caso('Placeholder del campo dominio', 'Contiene "Domain"', async ({ page }) => {
  const l = await abrir(page);
  await expect(l.dominio).toHaveAttribute('placeholder', /Domain/i);
});
caso('Campo dominio visible', 'Se muestra en pantalla', async ({ page }) => {
  const l = await abrir(page);
  await expect(l.dominio).toBeVisible();
});
for (const v of ['mail', 'gmail', 'example', 'a', 'x'.repeat(30), '123', 'sub-domain', 'UPPER']) {
  caso(`Escribir dominio (${corto(v)})`, 'El valor se conserva', async ({ page }) => {
    const l = await abrir(page);
    await l.dominio.fill(v);
    await expect(l.dominio).toHaveValue(v);
  });
}
caso('Selector de dominio visible', 'El campo desplegable se muestra', async ({ page }) => {
  const l = await abrir(page);
  await expect(l.campoDropdown).toBeVisible();
});
caso('Abrir el desplegable', 'Aparecen opciones de dominio', async ({ page }) => {
  const l = await abrir(page);
  await l.campoDropdown.click();
  await expect(l.opciones.first()).toBeVisible();
});
caso('Cantidad de opciones', 'Hay al menos 2 opciones', async ({ page }) => {
  const l = await abrir(page);
  await l.campoDropdown.click();
  expect(await l.opciones.count()).toBeGreaterThanOrEqual(2);
});
for (let i = 0; i < 8; i++) {
  caso(`Elegir la opción #${i + 1} del desplegable`, 'El campo muestra el texto de la opción elegida', async ({ page }) => {
    const l = await abrir(page);
    await l.campoDropdown.click();
    const opcion = l.opciones.nth(i);
    await expect(opcion).toBeVisible();
    const texto = (await opcion.innerText()).trim();
    await opcion.click();
    await expect(l.campoDropdown).toContainText(texto);
  });
}
caso('Avanzar con el dominio vacío', 'No avanza: permanece en la página 1 de 4', async ({ page }) => {
  await abrir(page);
  await completarPagina1(page, { dominio: '' });
  await sigueEnPagina(page, 1);
});
// Hallazgo: el sitio NO valida el texto del dominio; basta con que no esté vacío y con elegir una extensión.
for (const v of [' ', 'a b', '@', '..', '.', '-']) {
  caso(`Dominio inusual (${corto(v)}) con extensión elegida`, 'El sitio lo acepta y avanza a la página 2 de 4', async ({ page }) => {
    await abrir(page);
    await completarPagina1(page, { dominio: v });
    await esperarPagina(page, 2);
  });
}
caso('Avanzar sin elegir extensión de dominio', 'No avanza: permanece en la página 1 de 4', async ({ page }) => {
  const l = await abrir(page);
  await l.email.fill('sinextension');
  await l.pass.fill('Пр1Asinextensionж');
  await l.dominio.fill('mail');
  await l.terminosBox.click();
  await l.siguiente.click();
  await sigueEnPagina(page, 1);
});
caso('Cerrar el desplegable al elegir una opción', 'La lista de opciones deja de mostrarse', async ({ page }) => {
  const l = await abrir(page);
  await l.campoDropdown.click();
  await expect(l.opciones.first()).toBeVisible();
  await l.opciones.nth(1).click();
  await expect(l.opciones.first()).toBeHidden();
});
caso('Abrir el desplegable por segunda vez', 'Las opciones vuelven a mostrarse', async ({ page }) => {
  const l = await abrir(page);
  await l.campoDropdown.click();
  await l.opciones.nth(1).click();
  await l.campoDropdown.click();
  await expect(l.opciones.first()).toBeVisible();
});
caso('Cambiar de opción', 'El campo refleja la última opción elegida', async ({ page }) => {
  const l = await abrir(page);
  await l.campoDropdown.click();
  await l.opciones.nth(1).click();
  await l.campoDropdown.click();
  const texto = (await l.opciones.nth(2).innerText()).trim();
  await l.opciones.nth(2).click();
  await expect(l.campoDropdown).toContainText(texto);
});
caso('Textos de las opciones', 'Ninguna opción tiene texto vacío', async ({ page }) => {
  const l = await abrir(page);
  await l.campoDropdown.click();
  const textos = await l.opciones.allInnerTexts();
  expect(textos.length).toBeGreaterThan(0);
  expect(textos.every((t) => t.trim().length > 0)).toBe(true);
});
caso('Opción .com disponible', 'Entre las opciones existe ".com"', async ({ page }) => {
  const l = await abrir(page);
  await l.campoDropdown.click();
  await expect(l.opciones.filter({ hasText: /\.com/ }).first()).toBeAttached();
});
caso('Opciones sin duplicados', 'Todos los textos son distintos', async ({ page }) => {
  const l = await abrir(page);
  await l.campoDropdown.click();
  const textos = (await l.opciones.allInnerTexts()).map((t) => t.trim());
  expect(new Set(textos).size).toBe(textos.length);
});
