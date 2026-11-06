// Recorre el juego paso a paso y guarda en diagnostico.txt lo que realmente hay en el DOM.
// Uso: npm run diagnostico   (dura ~1 minuto). Después comparte diagnostico.txt.
const { chromium } = require('@playwright/test');
const fs = require('fs');

const out = [];
const log = (...a) => { const l = a.join(' '); out.push(l); console.log(l); };
const cortar = (s, n = 400) => String(s || '').replace(/\s+/g, ' ').slice(0, n);

async function volcar(page, titulo) {
  log(`\n================ ${titulo} ================`);
  log('URL:', page.url(), '| TITLE:', await page.title());
  log('\n--- Texto visible (primeros 1200 caracteres) ---');
  log(cortar(await page.locator('body').innerText().catch(() => ''), 1200));

  log('\n--- Coincidencias de "n / 4" ---');
  log(JSON.stringify(await page.evaluate(() => {
    const re = /\d\s*\/\s*\d/;
    return [...document.querySelectorAll('body *')]
      .filter((e) => e.children.length === 0 && re.test(e.textContent || ''))
      .slice(0, 5).map((e) => e.outerHTML.slice(0, 200));
  })));

  log('\n--- INPUTS ---');
  const inputs = await page.evaluate(() => [...document.querySelectorAll('input, textarea, select')].map((e, i) => ({
    i, tag: e.tagName, type: e.type, id: e.id, name: e.name, placeholder: e.placeholder, cls: e.className,
    checked: e.checked, visible: !!(e.offsetWidth || e.offsetHeight), value: (e.value || '').slice(0, 30),
  })));
  inputs.forEach((x) => log(JSON.stringify(x)));

  log('\n--- LABELS / CHECKBOXES (outerHTML) ---');
  const cbs = await page.evaluate(() => [...document.querySelectorAll('label, .checkbox, .checkbox__box')]
    .slice(0, 40).map((e) => e.outerHTML.replace(/\s+/g, ' ').slice(0, 260)));
  cbs.forEach((x) => log(x));

  log('\n--- DROPDOWN ---');
  log(JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('[class*="dropdown"]')]
    .slice(0, 12).map((e) => e.outerHTML.replace(/\s+/g, ' ').slice(0, 260)))));

  log('\n--- Elementos con texto clave ---');
  log(JSON.stringify(await page.evaluate(() => {
    const re = /next|send to bottom|not really|terms|upload|download|unselect|select all|here/i;
    return [...document.querySelectorAll('a, button, span, div, p, label')]
      .filter((e) => e.children.length === 0 && re.test(e.textContent || ''))
      .slice(0, 25).map((e) => e.outerHTML.replace(/\s+/g, ' ').slice(0, 220));
  }), null, 1));
}

(async () => {
  const browser = await chromium.launch({ headless: !process.env.HEADED });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errores.push('console: ' + m.text()));

  await page.goto('https://userinyerface.com/');
  await volcar(page, 'INICIO');
  await page.screenshot({ path: 'diag-1-inicio.png' });

  const aqui = page.getByText(/^\s*here\s*$/i).first();
  log('\n[paso] clic en HERE:', await aqui.click({ timeout: 5000 }).then(() => 'ok', (e) => 'ERROR ' + cortar(e.message, 200)));
  await page.waitForTimeout(2000);
  await volcar(page, 'PÁGINA 1 (formulario)');
  await page.screenshot({ path: 'diag-2-pagina1.png' });

  const paso = async (nombre, fn) => {
    const r = await fn().then(() => 'ok', (e) => 'ERROR ' + cortar(e.message, 300));
    log(`[paso] ${nombre}: ${r}`);
  };
  const local = 'qa' + Date.now().toString(36);
  await paso('cerrar cookies', () => page.getByText(/not really, no/i).first().click({ timeout: 3000 }));
  await paso('cerrar ayuda (Send to bottom)', () => page.getByText(/send to bottom/i).first().click({ timeout: 3000 }));
  await paso('correo', () => page.getByPlaceholder('Your email').fill(local, { timeout: 4000 }));
  await paso('contraseña', () => page.getByPlaceholder('Choose Password').fill(`Пр1A${local}ж`, { timeout: 4000 }));
  await paso('dominio', () => page.getByPlaceholder('Domain').fill('mail', { timeout: 4000 }));
  await paso('abrir desplegable', () => page.locator('.dropdown__field').first().click({ timeout: 4000 }));
  log('Opciones del desplegable:', JSON.stringify(await page.locator('.dropdown__list-item').allInnerTexts().catch(() => [])));
  await paso('elegir opción', () => page.locator('.dropdown__list-item').nth(1).click({ timeout: 4000 }));

  log('\n--- Prueba de casillas: estado antes y después de cada clic en .checkbox__box ---');
  const cajas = page.locator('.checkbox__box');
  const n = await cajas.count();
  log('Cantidad de .checkbox__box:', n);
  for (let k = 0; k < Math.min(n, 4); k++) {
    const antes = await page.locator('input[type="checkbox"]').evaluateAll((els) => els.map((e) => e.checked));
    await cajas.nth(k).click({ timeout: 3000 }).catch((e) => log(`  clic #${k} ERROR`, cortar(e.message, 200)));
    const despues = await page.locator('input[type="checkbox"]').evaluateAll((els) => els.map((e) => e.checked));
    log(`  .checkbox__box #${k}: antes=${JSON.stringify(antes)} despues=${JSON.stringify(despues)}`);
    await cajas.nth(k).click({ timeout: 3000 }).catch(() => {}); // revertir
  }
  await paso('marcar términos (.checkbox__box #0)', () => cajas.first().click({ timeout: 3000 }));
  await page.screenshot({ path: 'diag-3-formulario-lleno.png' });
  await paso('clic en Next', () => page.getByText(/^\s*next\s*$/i).first().click({ timeout: 4000 }));
  await page.waitForTimeout(2500);
  await volcar(page, 'DESPUÉS DE NEXT (página 2 esperada)');
  await page.screenshot({ path: 'diag-4-despues-de-next.png', fullPage: true });

  log('\n--- Errores de JS/consola durante el recorrido ---');
  log(JSON.stringify(errores.slice(0, 10)));
  fs.writeFileSync('diagnostico.txt', out.join('\n'));
  log('\nListo. Archivo generado: diagnostico.txt (y capturas diag-*.png)');
  await browser.close();
})();
