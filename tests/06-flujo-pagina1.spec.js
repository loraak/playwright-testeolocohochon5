const { test, expect, contador } = require('../helpers/fixtures');
const { L, irAlJuego, completarPagina1, esperarPagina, passValida, unico, descartar } = require('../helpers/juego');

const nuevoId = contador('FLUJO');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);

// ---------- Registro válido con distintas extensiones de dominio (8)
for (let i = 1; i <= 8; i++) {
  caso(`Página 1 válida usando la opción de dominio #${i}`, 'Avanza a la página 2 de 4', async ({ page }) => {
    await irAlJuego(page);
    await completarPagina1(page, { opcion: i });
    await esperarPagina(page, 2);
  });
}

// ---------- Variantes de contraseña válida (4)
const variantes = [
  ['cirílico al inicio', (l) => `Пр1A${l}ж`],
  ['cirílico al final', (l) => `A1${l}Привет`],
  ['con símbolo', (l) => `Пр1A!${l}ж`],
  ['larga', (l) => `Пр1A${l}${'x'.repeat(30)}ж`],
];
for (const [nombre, fn] of variantes) {
  caso(`Contraseña válida (${nombre})`, 'Avanza a la página 2 de 4', async ({ page }) => {
    await irAlJuego(page);
    const local = unico('qa');
    await completarPagina1(page, { local, pass: fn(local) });
    await esperarPagina(page, 2);
  });
}

// ---------- Contenido de la página 2 tras avanzar (8)
async function p2(page) {
  await irAlJuego(page);
  await completarPagina1(page);
  await esperarPagina(page, 2);
  await descartar(page);
  return L(page);
}
caso('Página 2: indicador', 'Muestra "2 / 4"', async ({ page }) => {
  await p2(page);
  await esperarPagina(page, 2);
});
caso('Página 2: lista de intereses', 'Hay casillas de intereses', async ({ page }) => {
  await p2(page);
  expect(await page.locator('input[type="checkbox"]').count()).toBeGreaterThan(5);
});
caso('Página 2: enlace para subir imagen', 'Se muestra la opción "upload"', async ({ page }) => {
  const l = await p2(page);
  await expect(l.subir).toBeVisible();
});
caso('Página 2: botón Next', 'Se muestra el botón para continuar', async ({ page }) => {
  const l = await p2(page);
  await expect(l.siguiente).toBeVisible();
});
caso('Página 2: ya no aparece el campo de contraseña', 'El campo Choose Password no está visible', async ({ page }) => {
  const l = await p2(page);
  await expect(l.pass).toBeHidden();
});
caso('Página 2: URL', 'La URL sigue siendo la del juego', async ({ page }) => {
  await p2(page);
  await expect(page).toHaveURL(/game/);
});
caso('Página 2: temporizador', 'El contador de tiempo sigue visible', async ({ page }) => {
  const l = await p2(page);
  await expect(l.timer).toBeVisible();
});
caso('Página 2: botón atrás del navegador', 'La página sigue operativa tras volver', async ({ page }) => {
  await p2(page);
  await page.goBack();
  await expect(page.locator('body')).toBeVisible();
});
