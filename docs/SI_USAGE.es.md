# Declaración de uso de inteligencia artificial (SI)

Última actualización: 2026-11-15

## Resumen

Sí. Este proyecto usó un asistente de codificación con IA basado en modelos de la familia Gemini como
apoyo al desarrollo. La SI se usó para acelerar la implementación, los tests y la documentación, no
para concebir la idea del reto ni para sustituir el criterio científico del equipo.

## Herramientas utilizadas

- Un asistente de codificación con IA de la familia Gemini (herramienta agéntica de chat/código) para
  redacción y refactorización de código, generación de tests y documentación.
- No se usaron otras herramientas de SI: no se generaron imágenes, audio ni vídeo con IA, no se
  entrenaron modelos de machine learning y no se generaron mediciones científicas con IA.

## Alcance del apoyo de SI

La SI ayudó con:

- Implementación y refactorización de la app web estática (UI, análisis, renderizado y carga de datos).
- Scripts de generación de horizontes LOLA derivados, barridos mensuales de fechas y JSON de validación.
- Tests unitarios/de regresión, comprobaciones de build y verificación en navegador.
- Documentación bilingüe y revisión de textos.

El equipo definió y sigue siendo responsable de:

- La idea del reto, el alcance y la selección de funcionalidades.
- La lista curada de sitios, los perfiles de misión, los umbrales y los supuestos científicos.
- La interpretación de resultados y las recomendaciones finales.
- La verificación contra los datos fuente de NASA y las limitaciones documentadas.

## Datos y procedencia científica

- Los DEM LOLA y las efemérides de JPL Horizons son datos fuente auténticos de NASA/JPL. La SI no
  generó ni alteró las mediciones originales.
- Los productos derivados de `public/data/` (horizontes, barridos y JSON de validación) se generaron
  con scripts escritos con apoyo de SI. Son reproducibles con los comandos documentados.
- No se incluyen imágenes, vídeos ni audio generados con IA. Las texturas del globo son previews
  LROC/LOLA de NASA/ASU.
- No se incluyen logos, banderas ni identificadores de misión de NASA generados con IA. Los nombres de
  misiones y programas son referencias fácticas.

## Dónde se declara el uso de SI

- Este documento y los README.
- `package.json` → `siDisclosure`.
- `public/data/manifest.json` → `siDisclosure`.
- Cada JSON derivado de `public/data/` → objeto `si` de nivel superior con `assisted`, `tools`,
  `scope` y `details`.
- El modal "Datos NASA" de la app incluye una nota visible de uso de SI.

## Verificación

- `npm test`: tests de catálogo, horizontes, barridos, regresión, i18n y exportación.
- `npm run build`: build de producción.
- Comprobaciones en navegador: selector agrupado, comparación de 28 sitios, matriz 28×36,
  horizontes y barridos regionales de IM-1/IM-2, y renderizado en inglés y español.
- Procedencia numérica: LOLA 5 m/px + 80 m/px, curvatura lunar, 720 bins, cinco alturas de mástil,
  IAU 2000 local para sitios sin efemérides Horizons precalculadas y validación de 4.032 muestras
  contra Horizons para las efemérides precalculadas.

## Regenerar datos

Después de regenerar datos derivados, vuelve a aplicar los metadatos de SI y el manifiesto:

```bash
npm run data:si-metadata
npm run data:manifest
```

## Declaración para el formulario de envío

Sí. Usamos un asistente de codificación con IA de la familia Gemini para acelerar la implementación
del código, la refactorización, los tests y la documentación, y para ayudar a escribir los scripts que
generan productos de datos derivados. El equipo definió la idea del reto, el alcance científico, la
selección de sitios, los perfiles de misión y la interpretación de resultados; la SI no se usó para
concebir la solución. Los DEM LOLA y las efemérides de JPL Horizons son datos fuente auténticos, no
mediciones generadas con IA. No se incluyen imágenes, vídeos ni audio generados con IA. El uso se
declara en este documento, los README, `package.json`, `public/data/manifest.json`, cada archivo JSON
de datos derivado y el modal de datos de la app.
