const { test, expect, contador } = require('../helpers/fixtures');
const { L, irAlJuego, completarPagina1, sigueEnPagina, passValida, corto } = require('../helpers/juego');

const nuevoId = contador('EMAIL');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);

// ---------- Correos inválidos: no deben permitir avanzar (20)
const invalidos = ['', ' ', '   ', 'a b', 'a@b', '@', 'a@', '@a', 'a,b', 'a;b', 'a(b)', 'a<b>', '"a"', 'a\\b',
  'ñ', '日本語', '.', '..', 'a..b', 'x'.repeat(300)];
for (const e of invalidos) {
  caso(`Correo inválido (${corto(e)})`, 'No avanza: permanece en la página 1 de 4', async ({ page }) => {
    await irAlJuego(page);
    await completarPagina1(page, { local: e, pass: passValida('qa') });
    await sigueEnPagina(page, 1);
  });
}

// ---------- Comportamiento del campo (35)
const abrir = async (page) => { await irAlJuego(page); return L(page); };

caso('Placeholder del campo de correo', 'Contiene "Your email"', async ({ page }) => {
  const l = await abrir(page);
  await expect(l.email).toHaveAttribute('placeholder', /Your email/i);
});
caso('Campo de correo visible', 'Se muestra en pantalla', async ({ page }) => {
  const l = await abrir(page);
  await expect(l.email).toBeVisible();
});
for (const v of ['qa', 'test', 'user.name', 'user_name', 'user-name', 'user123', 'UPPER', 'mixed.Case', 'a', 'x'.repeat(50)]) {
  caso(`Escribir en correo (${corto(v)})`, 'El valor se conserva', async ({ page }) => {
    const l = await abrir(page);
    await l.email.fill(v);
    await expect(l.email).toHaveValue(v);
  });
}
caso('Borrar el correo', 'El campo queda vacío', async ({ page }) => {
  const l = await abrir(page);
  await l.email.fill('algo');
  await l.email.fill('');
  await expect(l.email).toHaveValue('');
});
caso('El correo persiste al perder el foco', 'El valor sigue tras hacer clic en otro campo', async ({ page }) => {
  const l = await abrir(page);
  await l.email.fill('persistente');
  await l.pass.click();
  await expect(l.email).toHaveValue('persistente');
});
caso('Recargar la página', 'El texto escrito se descarta', async ({ page }) => {
  const l = await abrir(page);
  await l.email.fill('temporal');
  await page.reload();
  expect(await L(page).email.inputValue()).not.toBe('temporal');
});
caso('Escribir el símbolo @ en el campo', 'El campo conserva el carácter', async ({ page }) => {
  const l = await abrir(page);
  await l.email.fill('a@b');
  await expect(l.email).toHaveValue('a@b');
});
caso('Tecla Tab desde el correo', 'El foco sale del campo', async ({ page }) => {
  const l = await abrir(page);
  await l.email.focus();
  await page.keyboard.press('Tab');
  await expect(l.email).not.toBeFocused();
});
caso('Seleccionar todo y borrar', 'Ctrl+A y Backspace vacían el campo', async ({ page }) => {
  const l = await abrir(page);
  await l.email.fill('borrar');
  await l.email.press('Control+A');
  await l.email.press('Backspace');
  await expect(l.email).toHaveValue('');
});
caso('Escritura tecla por tecla', 'El valor coincide con lo tecleado', async ({ page }) => {
  const l = await abrir(page);
  await l.email.focus();
  await l.email.press('Control+A'); // el campo trae un texto de ayuda; se reemplaza
  await l.email.pressSequentially('teclas', { delay: 20 });
  await expect(l.email).toHaveValue('teclas');
});
caso('Combinar correo con dominio', 'Ambos campos conservan su valor', async ({ page }) => {
  const l = await abrir(page);
  await l.email.fill('combo');
  await l.dominio.fill('mail');
  await expect(l.email).toHaveValue('combo');
  await expect(l.dominio).toHaveValue('mail');
});
for (const n of [2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 25, 30, 40, 60, 100]) {
  caso(`Correo de ${n} caracteres`, 'El valor conserva la longitud ingresada', async ({ page }) => {
    const l = await abrir(page);
    await l.email.fill('e'.repeat(n));
    await expect(l.email).toHaveValue('e'.repeat(n));
  });
}
