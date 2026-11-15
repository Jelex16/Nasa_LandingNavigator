# 30-second demo and 7-slide outline

## Story

**From NASA data to a landing decision in 30 seconds.**

The demo should show the two things judges remember:

1. A plain-language verdict for one site/date (Sun, DTE, blackout).
2. A launch-slip sweep that changes the decision when the date moves.

Use the comparison matrix and the site × date matrix to show the trade-off. Do not show unfinished features.

## 30-second video

Use the real app, desktop viewport, default settings and the default English UI: Malapert Massif, **Direct DTE demo**, **Vertical tracker**, mast 2 m, base date 2026-11-14.

| Time | Visual | English narration / subtitles |
|---|---|---|
| 0–5 s | App hero + south-pole globe | “Mission planners need to compare lunar south-pole sites and dates fast. Existing tools are built for experts.” |
| 5–15 s | Left verdict card for Malapert, 14 Nov 2026 | “Pick Malapert. 50% of the hours have sunlight, the Earth is visible 42% of the time, and the longest direct-to-Earth blackout is 12 days. With direct DTE, this is not viable.” |
| 15–25 s | Open **Dates** (launch slip), hover the curve, click **May 2027** | “Now sweep 36 months. A launch slip to May 2027 moves the site into polar night: zero sunlight and a 15-day blackout. That is the trade-off planners need to see before the date is fixed.” |
| 25–30 s | NASA data panel or comparison matrix | “Real LOLA terrain, JPL Horizons, and a 4,032-sample validation. Decision-support, not flight-certified.” |

### Exact numbers to use (default assumptions)

- **2026-11-14**: 50% Sun, 42% DTE, 12.0-day outage, mission index 48/100, NO-GO for direct DTE.
- **2027-05-01**: 0% Sun, 47% DTE, 14.8-day blackout (354 h), polar night for the 28-day window.
- These values come from `public/data/sweep/site23.json` and the live verdict. If the UI shows slightly different rounded values, read them from the screen.

### Recording checklist

- [ ] `npm run build` passes.
- [ ] Dev server or preview is running; browser at 1264×630 or larger.
- [ ] Malapert selected; profile **Direct DTE demo**; panel **Vertical tracker**; mast **2 m**; date **2026-11-14**.
- [ ] Console has no errors.
- [ ] The first-screen verdict shows Sun 50%, DTE 42%, Outage 12.0 days.
- [ ] **Dates** opens the 36-month sweep; the current-date marker is visible.
- [ ] Clicking May 2027 loads the date and updates the verdict.
- [ ] Record at 30 seconds or less; add English subtitles if the narration is in Spanish.
- [ ] Do not show the data modal for more than 2 seconds; the story is the decision.

## 7-slide outline (maximum 7 slides including title/intro)

1. **Title**: Lunar Landing Site Navigator — from NASA data to a landing decision.
2. **Problem**: south-pole lighting and communication; existing tools are complex; launch dates slip.
3. **Solution**: pick a site/date; see Sun and Earth against the real LOLA horizon; read the verdict.
4. **Demo**: Malapert 2026-11-14 verdict; launch slip to May 2027; how the decision changes.
5. **Data**: LOLA 5 m/80 m, Horizons DE441, 4,032-sample validation, real NASA data.
6. **Model and impact**: transparent metrics/profiles; mission planners, educators, public; limitations.
7. **Close**: what is next, references, repository, demo link.

## Submission checklist

- [ ] English project title and short description.
- [ ] English demo video (30 s max) or 7-slide deck.
- [ ] English subtitles if the video narration is in Spanish.
- [ ] References: NASA PGDA/LOLA, JPL Horizons, QuickMap, Moon Trek, Barker et al., Mazarico et al.
- [ ] Team members registered and on the Members tab.
- [ ] App link and repository public.
- [ ] Submit before **Sunday, November 15, 11:59 p.m. local time**.
- [ ] Do not claim flight certification or a probability of success. Say “decision-support.”

## Fallback if the sweep is not ready

If `public/data/sweep/site23.json` is missing, run:

```bash
npm run data:sweep
```

If the build or data fails during the demo, use the existing comparison matrix and the 28-day timeline. The core story remains: real LOLA + Horizons, a clear site/date trade-off, and transparent limitations.
