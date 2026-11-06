const base = require('@playwright/test');

/**
 * Generador de IDs por módulo (LOGIN-001, ...). Cada spec define su propio "caso"
 * para que Playwright asocie cada prueba con su archivo.
 * Título resultante:  ID | descripción | resultado esperado
 */
function contador(prefijo) {
  let n = 0;
  return () => `${prefijo}-${String(++n).padStart(3, '0')}`;
}

module.exports = { test: base.test, expect: base.expect, contador };
