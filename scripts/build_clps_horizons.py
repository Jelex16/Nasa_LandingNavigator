"""Build regional LOLA 80 m/px horizons for the polar CLPS sites.

IM-1 Odysseus (80.13 S, 1.44 E) and IM-2 Athena (84.7906 S, 29.1957 E) lie
inside the LOLA 80S regional DEM coverage. They have no 5 m/px near-field DEM,
so their profiles use the same regional-only geometry as Nobile/Haworth:

    elevation angle = arctan((z(r) - z0 - h - r^2 / (2 R_Moon)) / r)

with 720 azimuth bins (0.5 deg), five mast heights, 80 m radial sampling to
100 km and true-north azimuths. The script writes only the horizon files; the
site catalog lives in public/data/sites-clps.json.

Usage:
    python scripts/build_clps_horizons.py

Requires numpy and rasterio, plus the pipeline DEMs under ../pipeline/data/dem.
"""

from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_regional_horizons import (  # noqa: E402
    DEFAULT_DEM,
    HORIZON_DIR,
    ExtraSite,
    build_regional_horizon,
    verify_horizon,
    write_json,
)

CLPS_SITES: tuple[ExtraSite, ...] = (
    ExtraSite(
        id="im1_odysseus",
        name="IM-1 Odysseus — Malapert A",
        short_name="IM-1 Odysseus",
        lat_deg=-80.13,
        lon_east_deg=1.44,
        description=(
            "Intuitive Machines IM-1 Odysseus landed near Malapert A at 80.13 S, 1.44 E "
            "on 22 February 2024. Regional LOLA 80 m/px horizon; no 5 m/px near-field "
            "DEM is available for this point."
        ),
    ),
    ExtraSite(
        id="im2_athena",
        name="IM-2 Athena — Mons Mouton",
        short_name="IM-2 Athena",
        lat_deg=-84.7906,
        lon_east_deg=29.1957,
        description=(
            "Intuitive Machines IM-2 Athena landed in the Mons Mouton region at "
            "84.7906 S, 29.1957 E on 6 March 2025 and came to rest on its side. "
            "Regional LOLA 80 m/px horizon; no 5 m/px near-field DEM is available "
            "for this point."
        ),
    ),
)


def main() -> None:
    if not DEFAULT_DEM.exists():
        raise SystemExit(f"Missing regional DEM: {DEFAULT_DEM}")
    for site in CLPS_SITES:
        horizon, metadata, diagnostics = build_regional_horizon(
            site, DEFAULT_DEM, north_mode="true"
        )
        path = HORIZON_DIR / f"{site.id}.json"
        write_json(path, horizon, compact=True)
        summary = verify_horizon(path)
        print(
            f"{site.id}: elevation {summary['siteElevationM']:.2f} m, "
            f"slope {metadata['slopeDeg']:.3f} deg, "
            f"2 m horizon min/mean/max "
            f"{summary['min']:.3f}/{summary['mean']:.3f}/{summary['max']:.3f} deg"
        )
        print(
            f"  valid radial samples "
            f"{diagnostics['radialSamplesValid']}/{diagnostics['radialSamplesTotal']}"
        )


if __name__ == "__main__":
    main()
