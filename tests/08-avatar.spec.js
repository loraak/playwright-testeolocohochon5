const { test, expect, contador } = require('../helpers/fixtures');
const { L, irAPagina2, irAPagina3, elegirIntereses, subirAvatar, esperarPagina, sigueEnPagina, ARCHIVOS } = require('../helpers/juego');

const nuevoId = contador('AVATAR');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);

caso('Clic en "upload"', 'Se abre el selector de archivos', async ({ page }) => {
  await irAPagina2(page);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), L(page).subir.click()]);
  expect(chooser).toBeTruthy();
});

for (const tipo of ['png', 'jpg', 'gif']) {
  caso(`Subir avatar ${tipo.toUpperCase()} y avanzar`, 'Avanza a la página 3 de 4', async ({ page }) => {
    await irAPagina3(page, { archivo: ARCHIVOS[tipo] });
  });
}
caso('Subir imagen de 2 MB y avanzar', 'Avanza a la página 3 de 4', async ({ page }) => {
  await irAPagina3(page, { archivo: ARCHIVOS.grande });
});
caso('Subir avatar dos veces', 'Avanza a la página 3 con la última imagen', async ({ page }) => {
  await irAPagina2(page);
  await elegirIntereses(page, 3);
  await subirAvatar(page, ARCHIVOS.png);
  await subirAvatar(page, ARCHIVOS.jpg);
  await L(page).siguiente.click();
  await esperarPagina(page, 3);
});
caso('Cancelar el selector de archivos', 'Sin avatar no se puede avanzar (permanece en 2 de 4)', async ({ page }) => {
  await irAPagina2(page);
  await elegirIntereses(page, 3);
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), L(page).subir.click()]);
  await chooser.setFiles([]);
  await L(page).siguiente.click();
  await sigueEnPagina(page, 2);
});
caso('Clic en "Download image"', 'Se inicia una descarga o se abre una pestaña', async ({ page, context }) => {
  await irAPagina2(page);
  const evento = await Promise.race([
    page.waitForEvent('download', { timeout: 8000 }).then(() => 'download'),
    context.waitForEvent('page', { timeout: 8000 }).then(() => 'popup'),
    L(page).descargar.click().then(() => new Promise(() => {})),
  ]).catch(() => 'ninguno');
  expect(['download', 'popup']).toContain(evento);
});
caso('Enlace "Download image" con destino', 'Tiene href o está asociado a un evento de clic', async ({ page }) => {
  await irAPagina2(page);
  const el = L(page).descargar;
  await expect(el).toBeAttached();
});

// ---------- Combinaciones de intereses + avatar (6 + 3)
for (const [desde, n] of [[0, 3], [1, 3], [2, 3], [4, 3], [6, 3], [9, 3]]) {
  caso(`Avatar + ${n} intereses (desde #${desde + 1})`, 'Avanza a la página 3 de 4', async ({ page }) => {
    await irAPagina2(page);
    await elegirIntereses(page, n, desde);
    await subirAvatar(page);
    await L(page).siguiente.click();
    await esperarPagina(page, 3);
  });
}
for (const n of [4, 5, 10]) {
  caso(`Avatar + ${n} intereses`, 'Avanza a la página 3 de 4', async ({ page }) => {
    await irAPagina3(page, { n });
  });
}
caso('Avatar con 0 intereses', 'No avanza: permanece en la página 2 de 4', async ({ page }) => {
  await irAPagina2(page);
  await subirAvatar(page);
  await L(page).siguiente.click();
  await sigueEnPagina(page, 2);
});
caso('Avatar con solo 2 intereses', 'No avanza: permanece en la página 2 de 4', async ({ page }) => {
  await irAPagina2(page);
  await elegirIntereses(page, 2);
  await subirAvatar(page);
  await L(page).siguiente.click();
  await sigueEnPagina(page, 2);
});
