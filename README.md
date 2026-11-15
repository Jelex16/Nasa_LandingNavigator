# Lunar Landing Site Navigator — LOLA + JPL Horizons

Herramienta de apoyo a decisiones para comparar sitios y fechas de alunizaje en el polo sur lunar.
Combina **topografía LOLA real** con **efemérides aparentes de JPL Horizons** para estimar energía solar,
eclipses, visibilidad directa a Tierra (DTE), cortes de comunicaciones y el efecto de la fecha de aterrizaje.

Proyecto para **NASA Space Apps Challenge 2026 — Lunar Landing Site Navigator**.

> English summary: this is a static Vite web app that compares twelve lunar sites (nine curated plus
> three international references) using real NASA LOLA horizon profiles and JPL Horizons DE441
> Sun/Earth ephemerides. It includes a 2.5D LOLA horizon panorama, a 28-day power/DTE timeline, a
> transparent multi-criteria score, a site comparison matrix, a site × date heatmap, a visual
> side-by-side A/B view, shareable scenario links, JSON/CSV export, a bilingual educational guide and
> custom coordinates. It is decision-support and educational software, not a flight-certified tool.

> **For judges:** [English README](README.en.md) · [Feature reference (English)](docs/features.md) ·
> [Referencia de features (Español)](docs/features.es.md) ·
> [30-second demo script and 7-slide outline](docs/demo.md)

---

## Qué incluye

- **12 sitios**: 8 sitios polares —Malapert Massif, Connecting Ridge, Shackleton Rim (punto LOLA no
  oficial), Peak near Shackleton, de Gerlache Rim, Mons Mouton/Leibnitz Beta, Nobile Rim 1 y Haworth—
  más Apollo 11 como referencia ecuatorial y 3 referencias internacionales: Chandrayaan-3 (Shiv
  Shakti), SLIM (Shioli) y Chang'e 4 (Von Kármán).
- **Horizontes LOLA reales**:
  - 6 sitios polares con DEM local de **5 m/px** + DEM regional **80 m/px** hasta 100 km (SUNDIAL hybrid).
  - Nobile Rim 1 y Haworth con **DEM regional LOLA 80 m/px** únicamente; se etiquetan como tal.
  - Apollo 11 con horizonte analítico plano (referencia, no candidato).
  - **Referencias internacionales** con horizonte analítico plano e IAU 2000 local; **no** son análisis
    LOLA del terreno. Chang'e 4 está en la cara oculta: DTE 0% y necesidad de relé. Chandrayaan-3 a
    69.4°S es una simplificación porque la iluminación polar depende del terreno.
- **Efemérides JPL Horizons DE441**: azimut/elevación aparentes del Sol y la Tierra, paso de 1 h,
  2026-01-01 → 2029-02-01, con interpolación cúbica de Hermite en el cliente.
- **Panorama 2.5D** de 360°: silueta LOLA, relieve sombreado, trayectoria solar de 24 h, bucle de
  libración terrestre de 28 días, discos finitos y etiquetas “bajo el horizonte”.
- **Globo 3D con capas LROC/LOLA** (vistas previas 2k/1k), control de relieve 1x/2.5x/5x/plano y
  enlaces centrados a **LROC QuickMap** y **NASA Moon Trek**. Las texturas del globo son visuales:
  el score usa los horizontes LOLA de `public/data/horizon`, no las texturas.
- **Radar polar** de horizonte, Sol y Tierra; curvas de 28 días con ventanas solares y DTE.
- **Score multicriterio transparente** (energía, eclipse continuo, DTE y corte de comunicaciones)
  con pesos y umbrales visibles, cuatro perfiles predefinidos, un perfil personalizado y un modal de
  modelo auditable.
- **Perfil personalizado**: el usuario define energía, eclipse, DTE y corte; la herramienta recalcula
  el score y el veredicto del sitio, la comparación, el barrido y la matriz. Cumplir los cuatro
  umbrales es `GO`. En modo estricto (por defecto), cualquier umbral incumplido es `NO-GO`; sin modo
  estricto, un umbral incumplido es `PRECAUCIÓN` si el índice es ≥50; si no, `NO-GO`.
- **Comparación de los 12 sitios** con la misma fecha de inicio, ventana, perfil, panel y mástil.
  Filas seleccionables; las referencias llevan badge `REFERENCE`.
- **A/B lado a lado**: dos escenarios sitio/fecha con radares LOLA, veredictos, métricas y tabla de
  deltas B−A; “Cargar en vista principal” abre cualquiera de los dos.
- **Matriz sitio × fecha**: 12 sitios × 36 meses con selector de métrica (score, Sol, DTE o corte);
  una celda carga ese sitio y esa fecha en la vista principal. Las filas de referencia están marcadas.
- **Compartir y exportar**: enlace de escenario con sitio/fecha/perfil/panel/mástil/idioma; botón
  Compartir; JSON del escenario con la serie de 672 puntos; CSV de comparación, barrido y matriz.
- **Guía educativa bilingüe**: “Cómo leer” abre inicio rápido, métricas, por qué el polo sur es
  difícil, glosario, “prueba esto” y límites.
- **UI bilingüe**: inglés por defecto y selector EN/ES que conserva la preferencia en el navegador.
- **Veredicto de primera pantalla**: porcentaje de horas con Sol, DTE centro y corte DTE máximo;
  el score compuesto queda como índice secundario, con el desglose plegado.
- **Barrido de fechas (launch slip)**: 36 ventanas mensuales 2026–2028 precalculadas con energía,
  DTE, corte máximo y próximo Earthset; un clic carga la fecha en la vista principal.
- **Selector visible**, coordenadas personalizadas (modelo aproximado, sin DEM LOLA), selector de
  altura de mástil (0.5–20 m), panel horizontal/vertical/tracker y perfiles de misión.
- **28 días de ventana** en todos los cálculos; el *playback* no altera la ventana de evaluación.
- **Datos y validación**: modal con fuentes, corrección de azimut, RMS de interpolación y manifiesto.

---

## Inicio rápido

```bash
npm install
npm run dev
# http://localhost:5173
```

Build de producción:

```bash
npm run build
npm run preview
```

El catálogo real y los horizontes se cargan desde `public/data/`. La app no necesita red para el
recorrido principal: las efemérides y los horizontes están precalculados y versionados.

Tests de regresión (motor, datos, i18n y exportación):

```bash
npm test
```

---

## Datos NASA y procedencia

| Fuente | Uso | Enlace |
|---|---|---|
| NASA PGDA LOLA 5 m/px landing-site DEMs | Campo cercano de 6 sitios | https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/ |
| NASA PGDA LOLA 80S 80 m/px regional DEM | Campo lejano y Nobile/Haworth | https://pgda.gsfc.nasa.gov/products/90 |
| NASA/JPL Horizons (DE441) | Az/el/distancias aparentes Sol/Tierra | https://ssd-api.jpl.nasa.gov/doc/horizons.html |
| NASA LRO / ASU LROC QuickMap | Enlaces y texturas preview LROC WAC | https://quickmap.lroc.asu.edu/ |
| NASA Solar System Treks (Moon Trek) | Enlaces y capas LOLA | https://trek.nasa.gov/moon/ |
| Barker et al. (2021) | DEMs LOLA de sitios de aterrizaje | https://doi.org/10.1016/j.pss.2020.105119 |
| Mazarico et al. (2011) | Iluminación polar con LOLA | https://doi.org/10.1016/j.icarus.2010.10.030 |

Los productos derivados y sus hashes están en
[`public/data/manifest.json`](public/data/manifest.json). Los DEM originales (~0.5 GB) no se
distribuyen aquí; los horizontes, efemérides y metadatos derivados sí.

Los sitios internacionales de referencia (Chandrayaan-3, SLIM, Chang'e 4) usan un horizonte
analítico plano y el motor IAU 2000 local; **no** son análisis LOLA del terreno. El manifiesto
incluye una nota `referenceSitesNote` y el modal de datos lo indica.

### Corrección de azimut (importante)

El pipeline SUNDIAL original (`build_horizons.py`) tomaba la dirección hacia el polo sur lunar como
“norte”. Para un sitio del hemisferio sur, esa dirección es el **sur geográfico**, por lo que los
horizontes de 720 bins quedaron rotados 180° respecto de los azimuts de Horizons. En esta app:

- los 6 horizontes híbridos heredados se rotaron **+360 bins (+180°)**;
- Nobile/Haworth se regeneraron con `scripts/build_regional_horizons.py --north-mode true`;
- el bin 0 es ahora **norte geográfico** y el ajuste está documentado en el manifiesto y en las
  notas de cada archivo.

Esto cambia los resultados respecto de la versión anterior; por ejemplo, Malapert Massif pasa de un
“GO” basado en un horizonte invertido a un resultado conservador con el horizonte real.

---

## Modelo

El score **no es una red neuronal entrenada** ni una probabilidad de éxito. Es una suma ponderada:

```text
Score = 100 · (wE·E + wD·D + wC·C + wG·G) / (wE + wD + wC + wG)
```

- `E`: energía específica acumulada en 28 días / requerimiento del perfil.
- `D = 1 − D_max / tolerancia_eclipse`.
- `C`: visibilidad del centro de la Tierra (DTE) / requerimiento.
- `G = 1 − G_max / tolerancia_corte`.
- Se aplican restricciones duras: pendiente local >15° limita el estado; >25° es NO-GO; outages
  severos de DTE/eclipse también fuerzan NO-GO en los perfiles predefinidos.
- Los perfiles son: **Demo directa DTE**, **Rover nocturno**, **Puesto tripulado**,
  **Relé / store-and-forward** y **Personalizado**. El perfil de relé solo relaja las tolerancias;
  no simula un relé concreto. El perfil personalizado usa pesos iguales (1/1/1/1); en modo estricto,
  cualquier umbral incumplido es NO-GO.
- **Procedencia de los umbrales**: los horizontes LOLA y las efemérides Horizons son datos
  NASA/JPL. Los umbrales y pesos de los perfiles predefinidos son supuestos del equipo, **no
  requisitos NASA**; los umbrales personalizados son supuestos del usuario. La métrica de energía es
  irradiancia acumulada en el plano del panel, no un presupuesto eléctrico completo.
- Apollo 11 se marca **REFERENCIA** aunque su score numérico sea alto: no es un candidato polar.

`Comms` mide la racha continua más larga sin el centro de la Tierra visible, no el porcentaje
medio de DTE. Con el perfil directo por defecto (24 h de tolerancia), los sitios polares tienen
cortes de 226–672 h y el término vale 0/100. Eso es un resultado del modelo, no un dato
faltante. Con el perfil de relé (400 h) aparecen valores de 18–44 en la mayoría de los
candidatos; Shackleton y Haworth siguen en 0. Apollo 11, que nunca pierde la Tierra, da 100
pero se marca como referencia.

Con el perfil directo por defecto, varios sitios polares aparecen **NO-GO** porque los horizontes
LOLA reales producen outages DTE de días. Ese es el resultado científico, no un fallo de la UI: el
selector de perfil permite explorar un escenario con relé o almacenamiento. Si esos umbrales no
representan tu misión, usa **Personalizado** para definir energía, eclipse, DTE y corte; el veredicto
se recalcula con tus supuestos. En el pitch: *NASA data, our assumptions*.

### Fórmulas principales

- Horizonte: `h(θ) = max_r arctan[(z(r,θ) − z0 − h_obs − r²/(2R_M)) / r]`, `R_M = 1,737,400 m`.
- Fracción visible del disco finito: `f = [arccos x − x√(1−x²)] / π`, `x = clip((h−a)/ρ, −1, 1)`.
- Irradiancia: `DNI = 1361 (1 AU/d)²`; panel horizontal `DNI·f·sin a`; vertical fijo
  `DNI·f·cos a·cos Δβ`; tracker `DNI·f·cos a`.
- Energía: `Σ G·Δt` en Wh/m² sobre 28 días.

Las métricas crudas, los pesos y los umbrales se muestran en la UI y en el modal “Ver modelo”.

---

## Validación

`public/data/validation.json` contiene la validación fuera de malla del pipeline SUNDIAL contra
Horizons para 4.032 muestras:

- **RMS angular: 5×10⁻⁶°** (la UI lo redondea a 1×10⁻⁵°)
- **Error máximo: 1.22×10⁻⁴°** (la UI lo redondea a 1.2×10⁻⁴°)
- Aceptación: RMS < 0.01° y máximo < 0.05° → **PASS**.

El motor local IAU 2000 (usado para Nobile/Haworth, las referencias internacionales, coordenadas
personalizadas y como fallback fuera de cobertura) se comparó puntualmente con Horizons en
`-89.5°, 0°` el 2026-11-14: Δaz Sol 0.016°, Δel −0.001°; Δaz Tierra 0.011°, Δel 0.0003°. No
sustituye la validación completa del pipeline.

Las referencias internacionales no están cubiertas por esta validación LOLA: su horizonte es
analítico plano y sus efemérides son IAU 2000 local. Se incluyen para comparación y educación, no
como candidatos certificados.

---

## Regenerar datos (opcional)

```bash
# Nobile/Haworth desde el DEM regional 80 m/px (norte geográfico)
python scripts/build_regional_horizons.py --north-mode true

# Corregir los 6 horizontes híbridos heredados (idempotente)
npm run data:fix-azimuth

# Regenerar el barrido mensual 2026–2028 de los 12 sitios
npm run data:sweep

# Regenerar los horizontes planos de las referencias internacionales
npm run data:flat-horizons

# Regenerar el manifiesto de datos y sus checksums
npm run data:manifest
```

El barrido usa 28 días, paso de 1 h, mástil 2 m, panel vertical con seguimiento y perfil Demo DTE
como supuestos de referencia. La energía se guarda para los tres paneles; DTE y corte se calculan
con el mástil de 2 m y la UI avisa si el mástil actual es distinto. Los archivos generados están en
`public/data/sweep/`. Las referencias internacionales usan el motor IAU 2000 local y su horizonte
plano; su barrido es comparable solo con esa etiqueta de aproximación.

El pipeline SUNDIAL que generó los datos base no se distribuye en este repositorio; los productos
derivados y sus checksums están en `public/data/manifest.json`. Los DEM originales (~0.5 GB) no se
incluyen.

---

## Limitaciones

- Es una herramienta de apoyo a decisiones y educativa, **no flight-certified**.
- No modela rocas por debajo de la resolución del DEM, estado térmico, baterías, movilidad del rover,
  constelaciones de relé ni incertidumbre Monte Carlo.
- El horizonte es un perfil 1D por azimut; el panorama 2.5D es una representación sombreada de ese
  perfil, no un mesh 3D.
- Las texturas del globo 3D son **vistas previas** (2048×1024 y 1024×512); no son el DEM LOLA de
  5 m/px/80 m/px que alimenta el análisis y no se usan para calcular el score.
- Nobile/Haworth usan 80 m/px: el relieve sub-kilométrico no está resuelto y se etiqueta como
  regional.
- La coordenada de Haworth cae dentro de la cuenca del cráter (el DEM muestra las paredes dominando
  el horizonte), no en un punto de borde certificado.
- **Referencias internacionales**: Chandrayaan-3, SLIM y Chang'e 4 usan un horizonte analítico plano
  y IAU 2000 local, no LOLA; se muestran como `REFERENCE`. Chandrayaan-3 a 69.4°S es una
  simplificación; Chang'e 4 está en la cara oculta (DTE 0%, relé).
- **Coordenadas personalizadas**: usan el horizonte LOLA del sitio más cercano a ≤300 km o un
  horizonte plano; pendiente y elevación no están disponibles.
- **Globo 3D**: las texturas son previews y las esferas Sol/Tierra son ilustrativas y no a escala; no
  entran en el score.
- Cobertura de efemérides: 2026-01-01 a 2029-02-01; “tiempo real” se limita a ese rango.
- El score depende de los supuestos del perfil; no es una probabilidad de éxito.

---

## Créditos y uso de IA

Datos: NASA PGDA/LOLA, NASA/JPL Horizons, NASA LRO/LROC (ASU QuickMap) y NASA Solar System Treks.
Pipeline de datos base: SUNDIAL contributors. Texturas LROC/LOLA del globo: previews de NASA/ASU.
Código y adaptación: equipo de este repositorio. Desarrollo asistido por IA; las cifras y los datos
provienen del pipeline determinista y de las fuentes citadas, no de texto generado.

Este proyecto es independiente y no está avalado por NASA.
