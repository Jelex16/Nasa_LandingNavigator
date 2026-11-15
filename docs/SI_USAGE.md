# AI (Super Intelligence, SI) usage disclosure

Last updated: 2026-11-15

## Summary

Yes. This project used an AI coding assistant based on Gemini-family models as a development aid.
SI was used to accelerate implementation, testing and documentation, not to conceive the challenge
idea or to replace the team's scientific judgement.

## Tools used

- A Gemini-family AI coding assistant (agentic chat/code tool) for code drafting, refactoring,
  test generation and documentation.
- No other SI tools were used: no AI image generation, no AI audio/video generation, no machine
  learning model training, and no AI-generated scientific measurements.

## Scope of SI assistance

SI assisted with:

- Implementation and refactoring of the static web app (UI, analysis, rendering and data loading).
- Data-generation scripts for derived LOLA horizons, monthly date sweeps and validation JSON.
- Unit/regression tests, build checks and browser verification.
- Bilingual documentation and copy review.

The team defined and remains responsible for:

- The challenge idea, scope and feature selection.
- The curated site list, mission profiles, thresholds and scientific assumptions.
- The interpretation of results and the final recommendations.
- Verification against the NASA source data and the documented limitations.

## Data and scientific provenance

- The LOLA DEMs and JPL Horizons ephemerides are authentic NASA/JPL source data. SI did not generate
  or alter the original measurements.
- Derived products under `public/data/` (horizons, sweeps and validation JSON) were produced by
  scripts written with SI assistance. They are reproducible with the documented commands.
- No AI-generated images, videos or audio are included. The globe textures are NASA/ASU LROC/LOLA
  previews.
- No AI-generated NASA logos, flags or mission identifiers are included. Mission and program names
  are factual references.

## Where SI use is disclosed

- This document and the README files.
- `package.json` → `siDisclosure`.
- `public/data/manifest.json` → `siDisclosure`.
- Every derived JSON under `public/data/` → top-level `si` object with `assisted`, `tools`, `scope`
  and `details`.
- The app's "NASA data" modal includes a visible SI disclosure note.

## Verification

- `npm test`: catalog, horizon, sweep, regression, i18n and export tests.
- `npm run build`: production build.
- Browser checks: grouped site selector, 28-site comparison, 28×36 matrix, IM-1/IM-2 regional
  horizons and sweeps, and English/Spanish rendering.
- Numerical provenance: LOLA 5 m/px + 80 m/px, lunar curvature, 720 bins, five mast heights, local
  IAU 2000 for sites without precomputed Horizons ephemerides, and the 4,032-sample Horizons
  validation for the precomputed ephemerides.

## Regenerating data

After regenerating derived data, reapply the SI metadata and manifest:

```bash
npm run data:si-metadata
npm run data:manifest
```

## Statement for the submission form

Yes. We used a Gemini-family AI coding assistant to accelerate code implementation, refactoring,
tests and documentation, and to help write the scripts that generate derived data products. The team
defined the challenge idea, scientific scope, site selection, mission profiles and interpretation of
results; SI was not used to conceive the solution. NASA LOLA DEMs and JPL Horizons ephemerides are
authentic source data, not AI-generated measurements. No AI-generated images, video or audio are
included. The use is disclosed in this document, the README, `package.json`,
`public/data/manifest.json`, every derived JSON data file, and the app's data modal.
