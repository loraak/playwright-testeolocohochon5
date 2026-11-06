const { test, expect, contador } = require('../helpers/fixtures');
const { L, intereses, esperarPagina, irAPagina2, alternarInteres, estaMarcado, totalMarcados, elegirIntereses, sigueEnPagina } = require('../helpers/juego');

const nuevoId = contador('INTER');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);

caso('Cantidad de intereses', 'Hay al menos 15 intereses (todos marcados al entrar)', async ({ page }) => {
  await irAPagina2(page);
  expect(await intereses(page).count()).toBeGreaterThanOrEqual(15);
});

// ---------- Alternar cada interés (15)
for (let i = 0; i < 15; i++) {
  caso(`Alternar el interés #${i + 1}`, 'Su estado cambia al hacer clic', async ({ page }) => {
    await irAPagina2(page);
    const antes = await estaMarcado(page, i);
    await alternarInteres(page, i);
    expect(await estaMarcado(page, i)).toBe(!antes);
  });
}

// ---------- Doble clic vuelve al estado original (10)
for (let i = 0; i < 10; i++) {
  caso(`Marcar y desmarcar el interés #${i + 1}`, 'Regresa a su estado original', async ({ page }) => {
    await irAPagina2(page);
    const antes = await estaMarcado(page, i);
    await alternarInteres(page, i);
    await alternarInteres(page, i);
    expect(await estaMarcado(page, i)).toBe(antes);
  });
}

// ---------- Seleccionar N intereses (6)
for (const n of [1, 2, 3, 5, 8, 10]) {
  caso(`Dejar exactamente ${n} interés(es) marcados`, `Quedan ${n} marcados (todos vienen marcados por defecto)`, async ({ page }) => {
    await irAPagina2(page);
    await elegirIntereses(page, n);
    expect(await totalMarcados(page)).toBe(n);
  });
}

// ---------- Intentar avanzar sin avatar (5)
const combos = [[0, 3], [1, 3], [3, 3], [5, 4], [8, 5]];
for (const [desde, n] of combos) {
  caso(`Elegir ${n} intereses (desde #${desde + 1}) y avanzar sin avatar`, 'No avanza: permanece en la página 2 de 4', async ({ page }) => {
    await irAPagina2(page);
    await elegirIntereses(page, n, desde);
    await L(page).siguiente.click();
    await sigueEnPagina(page, 2);
  });
}
caso('Avanzar sin seleccionar intereses', 'No avanza: permanece en la página 2 de 4', async ({ page }) => {
  await irAPagina2(page);
  await L(page).siguiente.click();
  await sigueEnPagina(page, 2);
});

// ---------- Opciones "select all / unselect all" (4)
caso('Opción "Unselect all" presente', 'Existe el texto "unselect all"', async ({ page }) => {
  await irAPagina2(page);
  await expect(page.getByText(/unselect all/i).first()).toBeAttached();
});
caso('Opción "Select all" presente', 'Existe el texto "select all"', async ({ page }) => {
  await irAPagina2(page);
  await expect(page.getByText(/select all/i).first()).toBeAttached();
});
caso('Clic en "Unselect all"', 'Deja 0 intereses marcados', async ({ page }) => {
  await irAPagina2(page);
  await page.locator('label[for="interest_unselectall"]').click();
  expect(await totalMarcados(page)).toBe(0);
});
for (const n of [1, 3, 5]) {
  caso(`Seleccionar ${n} y usar "Unselect all"`, 'Quedan 0 intereses marcados', async ({ page }) => {
    await irAPagina2(page);
    await elegirIntereses(page, n);
    await page.locator('label[for="interest_unselectall"]').click();
    expect(await totalMarcados(page)).toBe(0);
  });
}

// ---------- Elementos de la página (6)
caso('Botón Next en la página de intereses', 'Está visible', async ({ page }) => {
  await irAPagina2(page);
  await expect(L(page).siguiente).toBeVisible();
});
caso('Enlace "upload" en la página de intereses', 'Está visible', async ({ page }) => {
  await irAPagina2(page);
  await expect(L(page).subir).toBeVisible();
});
caso('Enlace "Download image"', 'Está presente en la página', async ({ page }) => {
  await irAPagina2(page);
  await expect(L(page).descargar).toBeAttached();
});
caso('Imagen de avatar', 'Hay al menos una imagen visible', async ({ page }) => {
  await irAPagina2(page);
  expect(await page.locator('img:visible').count()).toBeGreaterThanOrEqual(1);
});
caso('Indicador de la página de intereses', 'Muestra "2 / 4"', async ({ page }) => {
  await irAPagina2(page);
  await esperarPagina(page, 2);
});
caso('Temporizador en la página de intereses', 'El contador sigue visible', async ({ page }) => {
  await irAPagina2(page);
  await expect(L(page).timer).toBeVisible();
});
