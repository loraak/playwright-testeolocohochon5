# 350 pruebas con Playwright (JavaScript) — userinyerface.com

## Requisitos
- Node.js 18 o superior

## Instalación y ejecución
```bash
npm install
npx playwright install chromium
npm run test:list     # lista las pruebas sin ejecutarlas (debe decir 350)
npm test              # ejecuta las 350 pruebas
npm run report        # abre el reporte HTML nativo de Playwright
```
Ejecutar un solo módulo: `npx playwright test tests/02-password.spec.js`
Ver el navegador: `npm run test:headed`

Salidas: `playwright-report/` (reporte HTML con capturas), `reports/results.json` y `test-results/` (capturas, videos y traces de fallos).

## Distribución (350)
| Archivo | Contenido | Pruebas |
|---|---|---|
| 01-inicio | Pantalla de bienvenida, enlace HERE, pantallas, errores | 25 |
| 02-password | Contraseñas inválidas y comportamiento del campo | 60 |
| 03-email | Correos inválidos y comportamiento del campo | 55 |
| 04-dominio | Campo dominio y desplegable de extensión | 35 |
| 05-terminos-overlays | Términos, cookies, "Send to bottom", temporizador, Next | 30 |
| 06-flujo-pagina1 | Registro válido (página 1 → 2) | 20 |
| 07-intereses | Página 2: intereses, select/unselect all | 50 |
| 08-avatar | Página 2: subir avatar y avanzar a la página 3 | 20 |
| 09-pagina3 | Página 3 (pruebas generales) | 15 |
| 10-responsive-calidad | 8 tamaños de pantalla, accesibilidad y rendimiento | 40 |

Cada prueba se llama `ID | descripción | resultado esperado`.

## Estructura
- `helpers/juego.js`: localizadores y acciones reutilizables (llegar a la página 2 o 3, subir avatar, etc.).
- `helpers/fixtures.js`: generador de IDs.
- `tests/`: un archivo por módulo.

## Si alguna prueba falla en la primera ejecución
Los localizadores se escribieron sin poder abrir el sitio. Están centralizados en `helpers/juego.js` (función `L`),
así que casi siempre basta corregirlos ahí. Los más probables: `.dropdown__field` / `.dropdown__list-item`,
`.checkbox__box`, los ids `interest_*`, el texto del botón "Next" y el indicador de página "n / 4".
Las reglas de contraseña del juego pueden variar: ajusta `passValida` en `helpers/juego.js`.
