const { test, expect, contador } = require('../helpers/fixtures');
const { L, irAlJuego, completarPagina1, sigueEnPagina, passValida, unico, corto } = require('../helpers/juego');

const nuevoId = contador('PASS');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);

// ---------- Contraseñas inválidas: no deben permitir avanzar (30)
const invalidas = ['', ' ', 'a', 'A', '1', '!', 'ab', 'Ab', 'Ab1', 'abc', 'abcdefgh', 'abcdefghij', 'ABCDEFGH',
  '12345678', '1234567890', 'abcd1234', 'abcdefg1', 'Abcdefgh', 'Abcdefghi', '!!!!!!!!', 'password', 'password1',
  'Password', 'qwerty123', 'пароль', 'ПАРОЛЬ', '😀😀😀😀😀😀😀😀', 'a'.repeat(300), '        ', "' OR 1=1 --"];
for (const p of invalidas) {
  caso(`Contraseña inválida (${corto(p)})`, 'No avanza: permanece en la página 1 de 4', async ({ page }) => {
    await irAlJuego(page);
    await completarPagina1(page, { pass: p });
    await sigueEnPagina(page, 1);
    await expect(L(page).pass).toBeVisible();
  });
}

// ---------- Comportamiento del campo (30)
const abrir = async (page) => { await irAlJuego(page); return L(page); };

caso('Placeholder del campo contraseña', 'Contiene "Choose Password"', async ({ page }) => {
  const l = await abrir(page);
  await expect(l.pass).toHaveAttribute('placeholder', /Choose Password/i);
});
caso('Campo contraseña visible', 'Se muestra en pantalla', async ({ page }) => {
  const l = await abrir(page);
  await expect(l.pass).toBeVisible();
});
for (const n of [1, 8, 16, 32, 64, 128]) {
  caso(`Escribir ${n} caracteres en contraseña`, 'El valor conserva la longitud ingresada', async ({ page }) => {
    const l = await abrir(page);
    await l.pass.fill('a'.repeat(n));
    await expect(l.pass).toHaveValue('a'.repeat(n));
  });
}
for (const v of ['Привет', '日本語', '😀', 'ñandú', 'Ünï']) {
  caso(`Caracteres Unicode en contraseña (${v})`, 'El valor se conserva intacto', async ({ page }) => {
    const l = await abrir(page);
    await l.pass.fill(v);
    await expect(l.pass).toHaveValue(v);
  });
}
caso('Borrar la contraseña', 'El campo queda vacío', async ({ page }) => {
  const l = await abrir(page);
  await l.pass.fill('algo');
  await l.pass.fill('');
  await expect(l.pass).toHaveValue('');
});
caso('El valor persiste al perder el foco', 'Tras hacer clic en otro campo el valor sigue', async ({ page }) => {
  const l = await abrir(page);
  await l.pass.fill('Persistente1');
  await l.email.click();
  await expect(l.pass).toHaveValue('Persistente1');
});
caso('Recargar la página', 'El texto escrito se descarta', async ({ page }) => {
  const l = await abrir(page);
  await l.pass.fill('Temporal1');
  await page.reload();
  expect(await L(page).pass.inputValue()).not.toBe('Temporal1');
});
caso('Tecla Tab desde la contraseña', 'El foco sale del campo contraseña', async ({ page }) => {
  const l = await abrir(page);
  await l.pass.focus();
  await page.keyboard.press('Tab');
  await expect(l.pass).not.toBeFocused();
});
caso('Espacios dentro de la contraseña', 'Se conservan los espacios', async ({ page }) => {
  const l = await abrir(page);
  await l.pass.fill(' a b ');
  await expect(l.pass).toHaveValue(' a b ');
});
for (const v of ['!@#$%^&*()', '\'"`', '\\//', '<>{}[]']) {
  caso(`Símbolos en contraseña (${v})`, 'El valor se conserva intacto', async ({ page }) => {
    const l = await abrir(page);
    await l.pass.fill(v);
    await expect(l.pass).toHaveValue(v);
  });
}
caso('Seleccionar todo y borrar', 'Ctrl+A y Backspace vacían el campo', async ({ page }) => {
  const l = await abrir(page);
  await l.pass.fill('Borrar123');
  await l.pass.press('Control+A');
  await l.pass.press('Backspace');
  await expect(l.pass).toHaveValue('');
});
caso('Escritura tecla por tecla', 'El valor coincide con lo tecleado', async ({ page }) => {
  const l = await abrir(page);
  await l.pass.focus();
  await l.pass.press('Control+A'); // el campo trae un texto de ayuda; se reemplaza
  await l.pass.pressSequentially('Teclas123', { delay: 20 });
  await expect(l.pass).toHaveValue('Teclas123');
});
caso('Contraseña de 1000 caracteres', 'El campo acepta la entrada sin errores', async ({ page }) => {
  const l = await abrir(page);
  await l.pass.fill('x'.repeat(1000));
  expect((await l.pass.inputValue()).length).toBeGreaterThan(0);
});
caso('Contraseña solo numérica larga', 'El valor se conserva', async ({ page }) => {
  const l = await abrir(page);
  await l.pass.fill('9876543210');
  await expect(l.pass).toHaveValue('9876543210');
});
caso('Secuencia de emojis', 'El valor se conserva', async ({ page }) => {
  const l = await abrir(page);
  await l.pass.fill('😀😃😄');
  await expect(l.pass).toHaveValue('😀😃😄');
});
caso('Salto de línea en la contraseña', 'El campo no admite saltos de línea', async ({ page }) => {
  const l = await abrir(page);
  await l.pass.fill('linea1\nlinea2');
  expect(await l.pass.inputValue()).not.toContain('\n');
});
caso('Tabulación como texto', 'El foco no queda atrapado en el campo', async ({ page }) => {
  const l = await abrir(page);
  await l.pass.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(l.pass).not.toBeFocused();
});
caso('Guiones, puntos y guion bajo', 'El valor se conserva intacto', async ({ page }) => {
  const l = await abrir(page);
  await l.pass.fill('a-b.c_d');
  await expect(l.pass).toHaveValue('a-b.c_d');
});
