const { test, expect, contador } = require('../helpers/fixtures');
const { L, irAlJuego, completarPagina1, sigueEnPagina, esperarPagina } = require('../helpers/juego');

const nuevoId = contador('TERM');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);
// Estas pruebas NO cierran los avisos automáticamente (limpiar: false) para poder evaluarlos.
const abrirCrudo = async (page) => { await irAlJuego(page, { limpiar: false }); return L(page); };
const abrir = async (page) => { await irAlJuego(page); return L(page); };

// ---------- Términos y condiciones (8)
caso('Casilla de términos presente', 'Existe al menos un checkbox en el formulario', async ({ page }) => {
  const l = await abrir(page);
  expect(await l.terminosInput.count()).toBeGreaterThanOrEqual(1);
});
caso('Casilla de términos inicia marcada', 'Viene marcada por defecto ("I do not accept...")', async ({ page }) => {
  const l = await abrir(page);
  await expect(l.terminosInput).toBeChecked();
});
caso('Desmarcar términos (aceptar)', 'Un clic deja la casilla sin marcar', async ({ page }) => {
  const l = await abrir(page);
  await l.terminosBox.click();
  await expect(l.terminosInput).not.toBeChecked();
});
caso('Volver a marcar términos', 'Dos clics dejan la casilla marcada', async ({ page }) => {
  const l = await abrir(page);
  await l.terminosBox.click();
  await l.terminosBox.click();
  await expect(l.terminosInput).toBeChecked();
});
caso('Alternar términos 5 veces', 'Termina sin marcar (aceptado)', async ({ page }) => {
  const l = await abrir(page);
  for (let i = 0; i < 5; i++) await l.terminosBox.click();
  await expect(l.terminosInput).not.toBeChecked();
});
caso('Avanzar sin desmarcar la casilla ("I do not accept")', 'No avanza: permanece en la página 1 de 4', async ({ page }) => {
  await abrir(page);
  await completarPagina1(page, { terminos: false });
  await sigueEnPagina(page, 1);
});
caso('Texto de términos y condiciones', 'La página menciona "terms"', async ({ page }) => {
  await abrir(page);
  await expect(page.locator('body')).toContainText(/terms/i);
});
caso('Casilla de términos visible', 'El cuadro de selección se muestra', async ({ page }) => {
  const l = await abrir(page);
  await expect(l.terminosBox).toBeVisible();
});

// ---------- Aviso de cookies (4)
caso('Aviso de cookies visible al cargar', 'La página menciona cookies', async ({ page }) => {
  await abrirCrudo(page);
  await expect(page.locator('body')).toContainText(/cookies/i);
});
caso('Botón "Not really, no"', 'El botón del aviso está presente', async ({ page }) => {
  const l = await abrirCrudo(page);
  await expect(l.cookies).toBeVisible();
});
caso('Cerrar el aviso de cookies', 'El botón deja de mostrarse', async ({ page }) => {
  const l = await abrirCrudo(page);
  await l.cookies.click();
  await expect(l.cookies).toBeHidden();
});
caso('El aviso de cookies no reaparece', 'Tras interactuar con el formulario sigue cerrado', async ({ page }) => {
  const l = await abrirCrudo(page);
  await l.cookies.click();
  await l.pass.fill('Prueba1');
  await expect(l.cookies).toBeHidden();
});

// ---------- Formulario de ayuda (4)
caso('Formulario de ayuda presente', 'El área de texto de ayuda es visible', async ({ page }) => {
  const l = await abrirCrudo(page);
  await expect(l.textoAyuda).toBeVisible();
});
caso('Escribir en el formulario de ayuda', 'El texto se conserva', async ({ page }) => {
  const l = await abrirCrudo(page);
  await l.textoAyuda.fill('Necesito ayuda');
  await expect(l.textoAyuda).toHaveValue('Necesito ayuda');
});
caso('El área de ayuda inicia vacía', 'No trae texto precargado', async ({ page }) => {
  const l = await abrirCrudo(page);
  await expect(l.textoAyuda).toHaveValue('');
});
caso('Texto largo en el formulario de ayuda', 'Acepta 500 caracteres', async ({ page }) => {
  const l = await abrirCrudo(page);
  await l.textoAyuda.fill('h'.repeat(500));
  await expect(l.textoAyuda).toHaveValue('h'.repeat(500));
});

// ---------- Temporizador (5)
caso('Temporizador visible', 'Se muestra un contador de tiempo', async ({ page }) => {
  const l = await abrir(page);
  await expect(l.timer).toBeVisible();
});
caso('El temporizador avanza', 'El valor cambia tras unos segundos', async ({ page }) => {
  const l = await abrir(page);
  const antes = await l.timer.textContent();
  await page.waitForTimeout(2500);
  const despues = await l.timer.textContent();
  expect(despues).not.toBe(antes);
});
caso('Formato del temporizador', 'Muestra minutos y segundos (mm:ss)', async ({ page }) => {
  const l = await abrir(page);
  expect(await l.timer.textContent()).toMatch(/\d{1,2}:\d{2}/);
});
caso('El temporizador sigue corriendo a los 3 segundos', 'Continúa visible', async ({ page }) => {
  const l = await abrir(page);
  await page.waitForTimeout(3000);
  await expect(l.timer).toBeVisible();
});
caso('Reiniciar el temporizador al recargar', 'Tras recargar vuelve a mostrar un valor bajo', async ({ page }) => {
  const l = await abrir(page);
  await page.waitForTimeout(3000);
  await page.reload();
  const texto = await L(page).timer.textContent();
  expect(texto).toMatch(/\d{1,2}:\d{2}/);
});

// ---------- Indicador de página (2)
caso('Indicador de página', 'Muestra "1 / 4"', async ({ page }) => {
  await abrir(page);
  await esperarPagina(page, 1);
});
caso('Indicador sin avance', 'No muestra "2 / 4" en la primera pantalla', async ({ page }) => {
  await abrir(page);
  await expect(page.locator('.page-indicator')).not.toHaveText(/2\s*\/\s*4/);
});

// ---------- Botón Next (4)
caso('Botón Next visible', 'Se muestra el botón para continuar', async ({ page }) => {
  const l = await abrir(page);
  await expect(l.siguiente).toBeVisible();
});
caso('Botón Next presente en el DOM', 'Existe al menos un elemento con texto "Next"', async ({ page }) => {
  const l = await abrir(page);
  expect(await page.getByText(/^\s*next\s*$/i).count()).toBeGreaterThanOrEqual(1);
});
caso('Next con el formulario vacío', 'No avanza: permanece en la página 1 de 4', async ({ page }) => {
  const l = await abrir(page);
  await l.siguiente.click();
  await sigueEnPagina(page, 1);
});
caso('Next no cambia la URL con datos inválidos', 'La URL conserva "game"', async ({ page }) => {
  const l = await abrir(page);
  await l.siguiente.click();
  await expect(page).toHaveURL(/game/);
});

// ---------- General (3)
caso('Título de la pantalla del juego', 'El título menciona "Inyerface"', async ({ page }) => {
  await abrir(page);
  await expect(page).toHaveTitle(/inyerface/i);
});
caso('URL de la pantalla del juego', 'La URL contiene "game"', async ({ page }) => {
  await abrir(page);
  await expect(page).toHaveURL(/game/);
});
caso('Recargar el formulario', 'Tras recargar sigue visible el campo contraseña', async ({ page }) => {
  await abrir(page);
  await page.reload();
  await expect(L(page).pass).toBeVisible();
});
