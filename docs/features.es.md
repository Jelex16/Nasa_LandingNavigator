# Referencia de features

**Lunar Landing Site Navigator — NASA Space Apps Challenge 2026.**

Web app estática (Vite) que compara sitios y fechas de alunizaje con topografía real LOLA de NASA y
efemérides JPL Horizons. Es apoyo a decisiones y software educativo, no un análisis de aterrizaje
certificado. La UI usa inglés por defecto; el selector EN/ES de la barra superior cambia a español y
recuerda la elección.

- [Referencia de features (Español)](features.es.md) · [Feature reference (English)](features.md)
- [README](../README.md) · [Guion de demo y slides](demo.md)

## 1. Catálogo de sitios

Doce sitios más coordenadas personalizadas. Los candidatos se puntúan; las referencias se muestran
como contexto y no se clasifican como candidatos.

| Sitio | Rol | Horizonte | Efemérides |
|---|---|---|---|
| Malapert Massif | Candidato Artemis III | LOLA 5 m/px + 80 m/px híbrido | JPL Horizons DE441 |
| Connecting Ridge | Candidato Artemis III | LOLA 5 m/px + 80 m/px híbrido | JPL Horizons DE441 |
| Shackleton Rim (LOLA) | Punto de análisis no oficial | LOLA 5 m/px + 80 m/px híbrido | JPL Horizons DE441 |
| Peak near Shackleton | Candidato Artemis III | LOLA 5 m/px + 80 m/px híbrido | JPL Horizons DE441 |
| de Gerlache Rim | Candidato Artemis III | LOLA 5 m/px + 80 m/px híbrido | JPL Horizons DE441 |
| Mons Mouton (Leibnitz Beta) | Candidato Artemis III | LOLA 5 m/px + 80 m/px híbrido | JPL Horizons DE441 |
| Nobile Rim 1 | Candidato Artemis III | LOLA 80 m/px regional | IAU 2000 local |
| Haworth (interior) | Punto de referencia de región | LOLA 80 m/px regional | IAU 2000 local |
| Apollo 11 (Mare Tranquillitatis) | Referencia ecuatorial histórica | Analítico plano | JPL Horizons DE441 |
| Chandrayaan-3 (Shiv Shakti) | Referencia internacional | Analítico plano (aprox.) | IAU 2000 local |
| SLIM (Shioli) | Referencia internacional | Analítico plano (aprox.) | IAU 2000 local |
| Chang'e 4 (Von Kármán) | Referencia internacional, cara oculta | Analítico plano (aprox.) | IAU 2000 local |

- **Históricos y otros programas**: Apollo 12, 14, 15, 16, 17; Luna 9, 16, 17, 21; Chang'e 3, 5, 6.
  Coordenadas reales, horizonte analítico plano y efemérides IAU 2000 locales. Se marcan como
  `REFERENCE`, no como candidatos Artemis III.
- **CLPS y comerciales**: IM-1 Odysseus e IM-2 Athena usan horizonte LOLA regional de 80 m/px;
  Blue Ghost 1 y el objetivo futuro IM-3 Reiner Gamma usan horizonte analítico plano. IM-1 está
  cerca del borde norte del DEM 80S, así que el relieve lejano hacia el norte puede estar
  subrepresentado.
- **Coordenadas personalizadas**: validación de latitud/longitud; se usa el horizonte LOLA real del
  sitio más cercano a ≤10 km y se muestra la distancia. Si no hay sitio a ≤10 km, horizonte plano.
  Pendiente y elevación se muestran como “—”; el resultado es explícitamente aproximado.
- **Referencias internacionales**: solo para comparación y educación. Usan coordenadas reales de
  misión, pero **no** topografía LOLA en esos puntos; su horizonte es analítico plano y sus efemérides
  son el motor IAU 2000 local. La UI, el modal de datos, el manifiesto y este documento lo indican.
  Chandrayaan-3 a 69.4°S es una simplificación porque la iluminación polar depende del terreno.
  Chang'e 4 está en la cara oculta: su DTE es 0% y necesita un relé; es un caso educativo deliberado.

## 2. Veredicto y métricas

- **Veredicto primero**: `GO`, `CAUTION`, `NO-GO` o `REFERENCE`, con resumen en lenguaje claro.
- **Sol %**: fracción de horas con al menos el 5% del disco solar sobre el horizonte LOLA.
- **DTE %**: fracción de horas con el centro de la Tierra sobre el horizonte local (directo a Tierra).
  La fracción de disco parcial se calcula y muestra, pero no entra en el score.
- **Corte DTE máximo**: racha continua más larga sin centro de Tierra visible en la ventana de 28 días.
- **Eclipse continuo máximo**: eclipse solar continuo más largo de la ventana.
- **Energía**: Wh/m² acumulados para el panel y mástil seleccionados, con DNI corregida por distancia
  Sol–Luna y fracción visible del disco solar.
- **Índice de misión**: índice ponderado secundario; no es una probabilidad de éxito.
- **Ver modelo**: fórmula, valores de componentes, pesos, umbrales, perfil y límites.
- **Ver desglose del score**: puntos por término, métrica cruda y umbral, con el estado de límites.

Estados y límites duros:

- pendiente >15° añade un límite; >25° es `NO-GO`;
- un corte DTE severo, un eclipse continuo severo o un DTE por debajo de la mitad del requisito
  fuerzan `NO-GO`;
- los sitios de referencia e internacionales siempre muestran `REFERENCE`, con una nota explicativa.

## 3. Visualizaciones

- **Radar polar LOLA**: máscara de horizonte, posiciones de Sol y Tierra, trayectorias de 28 días,
  estado bajo el horizonte y badge de fuente (`LOLA real`, `Analítico`, `Aproximado`).
- **Panorama 2.5D**: silueta LOLA de 360°, relieve sombreado, discos finitos Sol/Tierra, trayectoria
  solar de 24 h, bucle de libración terrestre de 28 días, marcas de horizonte, etiquetas “bajo el
  horizonte”, modos horizonte/cielo completo y discos reales/ampliados. El rango vertical se adapta
  al horizonte del sitio.
- **Timeline de 28 días**: curvas de elevación de Sol y Tierra, horizonte LOLA por azimut, bandas de
  visibilidad, tooltip con az/el/horizonte/fracciones/energía y clic para saltar.
- **Globo 3D**: capas preview LROC/LOLA, relieve 1x/2.5x/5x/plano, pines de sitios, líneas de visión
  Sol/Tierra y presets polo sur/sitio/global. El globo y las esferas Sol/Tierra son ilustrativos y no
  están a escala; no entran en el score.
- **Tarjetas de telemetría**: elevación Sol/Tierra, irradiancia del panel, horizonte LOLA y despeje,
  estado DTE.
- **Countdowns**: próximo ocaso/amanecer solar, próxima pérdida/Earthrise DTE y DTE continua.

## 4. Fechas, tiempo y launch slip

- Fecha/hora de misión en UTC, con opción de fecha personalizada.
- Presets: ventana de ejemplo (nov 2026), solsticio de verano sur (dic 2026), solsticio de invierno
  sur (jun 2026), tiempo real (limitado a la cobertura 2026–2029) y fecha personalizada.
- Pasos ±1 hora / ±1 día, scrubber de 28 días y playback 1x/10x/60x.
- La ventana de evaluación de 28 días empieza en la fecha de misión; el playback solo cambia el
  instante mostrado, no la ventana.
- **Barrido de launch slip**: 36 ventanas mensuales de 28 días, 2026–2028, con energía para el panel
  actual, Sol %, DTE %, corte máximo, próximo Earthset y score. Clic en un mes o en una fecha de la
  tabla para cargarla en la vista principal. DTE/corte se precalculan con mástil 2 m; la UI avisa si
  el mástil actual es distinto.

## 5. Comparaciones

- **Matriz comparativa**: los 28 sitios con la misma fecha, ventana, perfil, panel y mástil.
  Columnas: score/estado, energía, eclipse continuo, DTE centro, corte DTE y pendiente local. Filas
  clicables; las referencias llevan badge `REFERENCE`. Exportación CSV.
- **A/B lado a lado**: comparación visual de dos escenarios sitio/fecha con el perfil, panel y mástil
  actuales. Cada tarjeta muestra veredicto, radar LOLA compacto, Sol/DTE/corte/eclipse/energía/
  pendiente y el índice de misión (las referencias muestran `REFERENCE`). Una tabla de deltas muestra
  B−A con color según la dirección. “Cargar en vista principal” abre cualquiera de los escenarios.
  A/B es visual; usa Compartir/Exportar después de cargar un escenario.
- **Matriz sitio × fecha**: 28 sitios × 36 meses con selector de métrica (Score, Sol %, DTE %, corte).
  Las filas de referencia están marcadas; la nota explica que son contexto, no candidatos
  clasificados. Clic en una celda para cargar sitio y fecha. Exportación CSV.

## 6. Perfiles de misión y score

Perfiles y supuestos visibles y seleccionables:

| Perfil | Energía requerida | Tolerancia de eclipse | DTE requerido | Tolerancia de corte DTE |
|---|---|---|---|---|
| Demo DTE directo | 300 kWh/m² | 160 h | 60% | 24 h |
| Rover nocturno | 400 kWh/m² | 380 h | 30% | 48 h |
| Puesto tripulado con DTE directo | 450 kWh/m² | 120 h | 90% | 12 h |
| Relé / store-and-forward | 300 kWh/m² | 200 h | 20% | 400 h |
| Personalizado | definido por el usuario | definido por el usuario | definido por el usuario | definido por el usuario |

- Paneles: horizontal, vertical fijo y vertical con seguimiento.
- Alturas de mástil: 0.5, 2, 5, 10 y 20 m.
- Score: `100 · (wE·E + wD·D + wC·C + wG·G) / Σw`, con pesos y umbrales visibles.
- El perfil de relé solo relaja tolerancias de DTE/corte; no simula un relé concreto.
- **Perfil personalizado**: define los cuatro umbrales en el panel de misión y pulsa “Aplicar
  umbrales”. La herramienta recalcula el sitio actual, la comparación, el barrido y la matriz con
  esos umbrales. Usa pesos iguales (1/1/1/1). Cumplir los cuatro umbrales es `GO`. En modo estricto
  (por defecto), cualquier umbral incumplido fuerza `NO-GO`; sin modo estricto, un umbral incumplido
  es `PRECAUCIÓN` si el índice es ≥50; si no, `NO-GO`. El índice es un indicador de margen, no la
  regla de aprobación.
- **Procedencia**: los horizontes LOLA y las efemérides JPL Horizons son datos NASA/JPL. Los
  umbrales y pesos de los perfiles predefinidos son supuestos del equipo, **no requisitos NASA**.
  Los umbrales personalizados son supuestos del usuario. La métrica de energía es irradiancia
  acumulada en el plano del panel, no un presupuesto eléctrico completo (sin eficiencia de panel ni
  modelo de consumo).

## 7. UI bilingüe

- Inglés por defecto; el selector EN/ES de la barra superior cambia toda la UI, incluidas gráficas,
  tablas, tooltips, la guía y los valores generados.
- La elección se guarda en `localStorage`; un `lang=en|es` en la URL la anula para un enlace
  compartido.
- `<html lang>`, título, meta description y etiquetas ARIA siguen el idioma.
- README, esta referencia y el guion de demo están disponibles en inglés y español; el inglés es el
  idioma de submission.

## 8. Compartir y exportar

### Enlace de escenario

El escenario actual se codifica en la URL y se mantiene actualizado:

```text
/?site=site23&date=2026-11-14T00:00:00.000Z&profile=technology_demo&panel=vertical_tracker&mast=2&lang=en
```

| Parámetro | Significado | Valores |
|---|---|---|
| `site` | id de sitio curado | p. ej. `site23`, `nobile_rim_1`, `change4`, `control_eq` |
| `lat`, `lon` | coordenadas personalizadas (tienen prioridad sobre `site`) | lat −90…90, lon 0…360 |
| `date` | inicio de misión, ISO UTC | 2026-01-01 … 2029-01-01 |
| `profile` | id de perfil | `technology_demo`, `night_survivor`, `crewed_outpost`, `relay_store_forward` |
| `panel` | panel solar | `horizontal`, `vertical_fixed`, `vertical_tracker` |
| `mast` | altura de mástil en metros | `0.5`, `2`, `5`, `10`, `20` |
| `lang` | idioma de UI | `en`, `es` |

El botón **Compartir** copia el enlace completo. Al abrirlo se restauran sitio, fecha, perfil, panel,
mástil e idioma. La URL refleja cambios de sitio/fecha/perfil/panel/mástil; el playback y el scrubber
no la reescriben.

### Exportaciones

Todas son descargas en cliente; no requieren servidor ni cuenta.

- **Exportar JSON** (tarjeta de veredicto): escenario actual con metadatos del sitio, perfil, panel,
  mástil, métricas, componentes, estado y la serie completa de 672 puntos (az/el, horizontes,
  fracciones visibles, flags y energía).
- **Exportar CSV** (comparación): una fila por sitio con rol, coordenadas, score, energía, eclipse,
  DTE, corte, pendiente y fuentes de datos.
- **Exportar CSV** (barrido): 36 filas mensuales con energía del panel actual, Sol %, DTE %, corte,
  Earthset y score.
- **Exportar CSV** (matriz sitio × fecha): 12 filas de sitios × 36 scores mensuales, con columna de rol.

## 9. Guía educativa

**Cómo leer** en la tarjeta del veredicto abre una guía bilingüe con:

- **Inicio rápido**: sitio/fecha, veredicto, radar/panorama, Fechas, Comparar, Compartir.
- **Qué significan las métricas**: Sol %, DTE %, corte, eclipse, energía e índice de misión.
- **Por qué el polo sur es difícil**: Sol/Tierra cerca del horizonte, terreno, PSR/hielo, relé en la
  cara oculta.
- **Glosario**: LOLA, DEM, horizonte, DTE, PSR, libración, CLPS/HLS, Artemis III.
- **Prueba esto**: Malapert nov 2026 → may 2027 → A/B con Chang'e 4 → Compartir/Exportar.
- **Límites**: limitaciones declaradas y caveats de datos.

## 10. Datos, validación y procedencia

- **DEM LOLA 5 m/px de sitios de aterrizaje**: campo cercano de seis sitios.
- **DEM regional LOLA 80S 80 m/px**: campo lejano a 100 km y Nobile, Haworth, IM-1 e IM-2.
- **JPL Horizons DE441**: az/el/distancia aparentes topocéntricas de Sol/Tierra, paso de 1 h,
  2026-01-01 a 2029-02-01, interpolación cúbica de Hermite en el navegador.
- **Modelo de horizonte**: 720 bins de azimut (0.5°), cinco alturas de mástil, curvatura lunar
  `r²/(2R_M)`, horizonte airless (sin refracción atmosférica).
- **Validación**: 4.032 muestras fuera de malla contra Horizons; RMS 5×10⁻⁶°, máximo 1.22×10⁻⁴°
  (la UI redondea a 1×10⁻⁵° y 1.2×10⁻⁴°). El motor IAU 2000 local se usa para sitios sin efemérides
  Horizons precalculadas y como fallback; se comparó puntualmente con Horizons y no cubre la
  validación completa de 4.032 muestras.
- **Validación cruzada del terreno**: `public/data/terrain-validation.json` compara el DEM de 5 m/px
  de campo cercano con el DEM regional de 80 m/px en el rango de campo cercano de cada sitio
  (24 azimuts, mástil de 2 m). RMS agregado 0.51°, máximo 2.18°. Mide la concordancia entre
  productos, no la precisión absoluta: ambos derivan de LOLA y no resuelven rocas por debajo de su
  píxel.
- **Manifiesto de datos**: `public/data/manifest.json` lista 70 archivos derivados con tamaños y
  SHA-256; `npm run data:manifest` lo regenera. Los DEM originales (~0.5 GB) no se distribuyen.
- **Referencias internacionales**: horizontes analíticos planos e IAU 2000 local; no son análisis de
  terreno LOLA. El manifiesto incluye `referenceSitesNote` y el modal de datos lo indica.
- **Referencias históricas y CLPS**: Apollo, Luna y Chang'e usan horizonte analítico plano e IAU 2000
  local. IM-1/IM-2 usan LOLA regional de 80 m/px; Blue Ghost 1 e IM-3 son planos. Son puntos de
  referencia, no candidatos Artemis III.
- **Texturas 3D**: previews LROC WAC y LOLA (2k/1k); son visuales y no se usan para el score.

## 11. Accesibilidad, responsive y tests

- Controles operables por teclado, skip link, focus trap en modales, formularios etiquetados,
  `aria-live` en veredicto/toast, foco visible y soporte de `prefers-reduced-motion`.
- Auditoría axe WCAG A/AA: **0 violaciones** en inglés y español, incluidas guía, comparación y A/B.
- Layout responsive: header móvil, rail de cámara con scroll, tarjetas A/B en una columna, matrices
  con scroll horizontal y botón de timeline de 28 días sticky.
- Tests: motor, geometría, decodificación de datos reales, regresión de 28 días de Malapert, paridad
  de claves i18n, interpolación y exportación JSON/CSV. Ejecuta `npm test`.
- Build de producción: Vite; bundle actual ~801 KB minificado / ~216 KB gzip. Sigue el warning de
  chunk >500 KB; el code-splitting es una optimización futura.

## 12. Límites

- Software de apoyo a decisiones y educativo; **no flight-certified**.
- No modela rocas bajo la resolución del DEM, estado térmico, baterías, movilidad del rover,
  constelaciones de relé ni incertidumbre Monte Carlo.
- El horizonte es un perfil 1D por azimut; el panorama 2.5D es una representación sombreada, no un
  mesh 3D.
- Nobile, Haworth, IM-1 e IM-2 usan terreno regional de 80 m/px; los sitios históricos,
  internacionales y CLPS/comerciales no polares usan horizontes analíticos planos; los sitios
  personalizados usan el horizonte LOLA más cercano a ≤10 km o uno plano.
- El score es un índice de decisión, no una probabilidad de éxito. `gMaxHours` es una cota inferior
  dentro de la ventana de 28 días.
- El globo 3D, las esferas Sol/Tierra y las texturas preview son ilustrativos y no están a escala.
- La cobertura de efemérides es 2026-01-01 a 2029-02-01; no hay consulta en vivo a Horizons.

## 13. Comandos

```bash
npm install
npm run dev            # http://localhost:5173
npm run build
npm run preview
npm test               # motor, datos, i18n y exportación

npm run data:sweep             # 36 ventanas mensuales para todos los sitios
npm run data:flat-horizons     # horizontes planos de las referencias internacionales
npm run data:manifest          # tamaños y SHA-256 de public/data
npm run data:fix-azimuth       # corrección de azimut idempotente
npm run data:regional-horizons # Nobile/Haworth desde el DEM regional
```

## 14. Archivos clave

| Ruta | Propósito |
|---|---|
| `src/main.js` | estado, controles, estado de URL, cableado de compartir/exportar |
| `src/analysis/` | geometría, muestreo, scoring y estados |
| `src/ephemeris/` | decodificación/interpolación Horizons y fallback IAU 2000 |
| `src/topography/lunarData.js` | catálogo, horizonte, helpers localizados de sitios |
| `src/ui/` | radar, timeline, panorama, comparación, sweep, matriz, A/B y guía |
| `src/i18n.js`, `src/i18n-static.js` | mensajes EN/ES y traducción del HTML estático |
| `src/export.js` | serialización JSON/CSV y descargas |
| `public/data/` | sitios, horizontes, efemérides, sweeps, validación, manifiesto |
| `scripts/` | generación de datos y mantenimiento del manifiesto |
| `tests/` | tests de motor, datos, i18n y exportación |
