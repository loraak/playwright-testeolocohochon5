const { expect } = require('@playwright/test');

// ---------- Datos
const VIEWPORTS = [
  [320, 568], [375, 667], [414, 896], [768, 1024], [1024, 768], [1280, 720], [1366, 768], [1920, 1080],
];
const sufijo = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const unico = (p = 'qa') => `${p}${sufijo()}`;
// Reglas reales del juego: mínimo 10 caracteres, 1 mayúscula, 1 número, 1 letra del correo y (opcional) 1 cirílico.
const passValida = (local) => `Пр1A${local}жжжжжжж`;
const corto = (s) => (s.length > 25 ? `${s.length} caracteres` : s.trim() === '' ? `"${s}" (vacío/espacios)` : s);

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
const JPG = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
const ARCHIVOS = {
  png: { name: 'avatar.png', mimeType: 'image/png', buffer: PNG },
  jpg: { name: 'avatar.jpg', mimeType: 'image/jpeg', buffer: JPG },
  gif: { name: 'avatar.gif', mimeType: 'image/gif', buffer: GIF },
  grande: { name: 'avatar-grande.png', mimeType: 'image/png', buffer: Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]) },
};

// ---------- Localizadores
const L = (page) => ({
  aqui: page.getByText(/^\s*here\s*$/i).first(),
  pass: page.getByPlaceholder('Choose Password'),
  email: page.getByPlaceholder('Your email'),
  dominio: page.getByPlaceholder('Domain'),
  campoDropdown: page.locator('.dropdown__field').first(),
  opciones: page.locator('.dropdown__list-item'),
  terminosBox: page.locator('.checkbox__box').first(),
  terminosInput: page.locator('#accept-terms-conditions'),
  siguiente: page.getByText(/^\s*next\s*$/i).first(),
  timer: page.getByText(/\b\d{1,2}:\d{2}(:\d{2})?\b/).first(),
  cookies: page.getByText(/not really, no/i).first(),
  ayuda: page.locator('text=/send to bottom/i >> visible=true').first(),
  textoAyuda: page.locator('.help-form__text-area'),
  subir: page.getByText(/^\s*upload\s*$/i).first(),
  descargar: page.getByText(/download image/i).first(),
});
const intereses = (page) => page.locator('input[id^="interest_"]:not([id*="selectall"])');

// ---------- Acciones
async function descartar(page) {
  const l = L(page);
  for (const el of [l.cookies, l.ayuda]) {
    if (await el.isVisible().catch(() => false)) await el.click({ timeout: 2000 }).catch(() => {});
  }
}

async function irAlJuego(page, { limpiar = true } = {}) {
  const l = L(page);
  await page.goto('/game.html');
  const visible = await l.pass.isVisible({ timeout: 8000 }).catch(() => false);
  if (!visible) {
    await page.goto('/');
    await l.aqui.click();
  }
  await expect(l.pass).toBeVisible();
  if (limpiar) await descartar(page);
  return l;
}

async function elegirOpcion(page, indice) {
  const l = L(page);
  await l.campoDropdown.click();
  if (indice === undefined) {
    const com = l.opciones.filter({ hasText: /\.com/ }).first();
    if (await com.count()) { await com.click(); return; }
    indice = 1;
  }
  await l.opciones.nth(indice).click();
}

async function completarPagina1(page, o = {}) {
  const l = L(page);
  const local = o.local ?? unico('qa');
  await l.email.fill(local);
  await l.pass.fill(o.pass ?? passValida(local));
  await l.dominio.fill(o.dominio ?? 'mail');
  await elegirOpcion(page, o.opcion);
  // La casilla viene MARCADA por defecto ("I do not accept..."): hay que desmarcarla para aceptar.
  if (o.terminos !== false) await l.terminosBox.click();
  if (o.siguiente !== false) await l.siguiente.click();
  return local;
}

async function esperarPagina(page, n) {
  await expect(page.locator('.page-indicator')).toHaveText(new RegExp(`^\\s*${n}\\s*/\\s*4\\s*$`));
}

async function irAPagina2(page) {
  await irAlJuego(page);
  await completarPagina1(page);
  await esperarPagina(page, 2);
  await descartar(page);
}

async function alternarInteres(page, i) {
  const id = await intereses(page).nth(i).getAttribute('id');
  await page.locator(`label[for="${id}"]`).click();
}
const estaMarcado = (page, i) => intereses(page).nth(i).isChecked();
const totalMarcados = (page) => intereses(page).evaluateAll((els) => els.filter((e) => e.checked).length);

// En la página 2 TODOS los intereses vienen marcados: primero se limpian.
async function quitarTodos(page) {
  await page.locator('label[for="interest_unselectall"]').click();
  if ((await totalMarcados(page)) !== 0) {
    const total = await intereses(page).count();
    for (let i = 0; i < total; i++) if (await estaMarcado(page, i)) await alternarInteres(page, i);
  }
}

// Deja marcados exactamente n intereses (a partir del índice "desde").
async function elegirIntereses(page, n, desde = 0) {
  await quitarTodos(page);
  for (let i = desde; i < desde + n; i++) {
    if (!(await estaMarcado(page, i))) await alternarInteres(page, i);
  }
}

async function subirAvatar(page, archivo = ARCHIVOS.png) {
  const l = L(page);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), l.subir.click()]);
  await chooser.setFiles(archivo);
}

async function irAPagina3(page, { n = 3, archivo = ARCHIVOS.png } = {}) {
  await irAPagina2(page);
  await elegirIntereses(page, n);
  await subirAvatar(page, archivo);
  await L(page).siguiente.click();
  await esperarPagina(page, 3);
}

// Intenta avanzar y confirma que la página NO cambió (sigue en n/4).
async function sigueEnPagina(page, n) {
  await page.waitForTimeout(800);
  await esperarPagina(page, n);
}

module.exports = {
  VIEWPORTS, unico, passValida, corto, ARCHIVOS, L, intereses,
  descartar, irAlJuego, elegirOpcion, completarPagina1, esperarPagina, irAPagina2, irAPagina3,
  alternarInteres, estaMarcado, totalMarcados, quitarTodos, elegirIntereses, subirAvatar, sigueEnPagina,
};
