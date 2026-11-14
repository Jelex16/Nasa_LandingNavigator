"""Build real LOLA 80 m/px regional horizon profiles for extra lunar polar sites.

The reference pipeline (``pipeline/build_horizons.py``) produces hybrid profiles:
a PGDA 5 m/px near-field DEM inside ~7 km plus the LOLA 80S 80 m/px regional DEM
out to R = 100 km.  Two additional candidate sites (Nobile Rim 1, Haworth Rim)
have no 5 m/px coverage, so this script builds a *regional-only* profile from
``LDEM_80S_80MPP_ADJ.TIF`` alone, reusing exactly the same geometry:

    elevation angle = arctan((z(r) - z0 - h - r^2 / (2 R_Moon)) / r)

with a spherical lunar radius of 1 737 400 m, 720 azimuth bins of 0.5 deg,
five mast heights, 80 m radial sampling, and radii below max(25 m, 4 h)
excluded.  No near-field datum offset is estimated (there is no overlapping
5 m/px surface to compare against); the absolute LOLA 80S datum is used.

Azimuth origin
--------------
``--north-mode pole`` reproduces ``build_horizons.py`` bit-for-bit: the
reference takes the direction toward the projected pole as "north", and for a
*southern* site that direction is geographic *south*. Bin k (k * 0.5 deg)
therefore points at compass azimuth (k * 0.5 + 180) deg -- the same convention
as the seven existing site profiles before this app's correction. ``--north-mode
true`` is the default here and shifts the origin by 180 deg so bin k is the
geographic compass azimuth (0 = true north, 90 = east), which is what
``src/ephemeris/astronomy.js`` uses for the Sun/Earth azimuths.

Outputs (additive only -- existing horizon/site JSONs are never touched):

    public/data/horizon/nobile_rim_1.json
    public/data/horizon/haworth_rim.json
    public/data/sites-extra.json

Usage:
    python scripts/build_regional_horizons.py [--dem PATH] [--site ID]
                                              [--north-mode {pole,true}]
                                              [--out-dir PATH]
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import rasterio
from rasterio.warp import transform as warp_transform
from rasterio.windows import Window

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_DATA = PROJECT_ROOT / "public" / "data"
HORIZON_DIR = PUBLIC_DATA / "horizon"
DEFAULT_DEM = PROJECT_ROOT.parent / "pipeline" / "data" / "dem" / "LDEM_80S_80MPP_ADJ.TIF"
DEM_BASENAME = "LDEM_80S_80MPP_ADJ.TIF"

# --- constants mirrored from pipeline/common.py -----------------------------
LUNAR_RADIUS_M = 1_737_400.0
GEOGRAPHIC_CRS = "+proj=longlat +R=1737400 +no_defs"
MAST_HEIGHTS_M = np.array([0.5, 2.0, 5.0, 10.0, 20.0], dtype=np.float64)
HORIZON_BIN_COUNT = 720
HORIZON_BIN_WIDTH_DEG = 0.5
FAR_FIELD_RADIUS_KM = 100.0
FAR_SAMPLE_STEP_M = 80.0
HORIZON_MODE = "lola_regional_80m"
PROVENANCE = "lola_regional_80m"

ELEVATION_PATCH_PX = 5  # 5 x 5 pixels = 400 m patch median for the site elevation
SLOPE_WINDOW_PX = 41  # 41 x 41 pixels = 3.28 km plane fit

CITATIONS = [
    {
        "label": "Barker et al. (2021), Improved LOLA Elevation Maps for South Pole Landing Sites",
        "url": "https://doi.org/10.1016/j.pss.2020.105119",
    },
    {
        "label": "Mazarico et al. (2011), Illumination conditions of the lunar polar regions using LOLA topography",
        "url": "https://doi.org/10.1016/j.icarus.2010.10.030",
    },
    {
        "label": "NASA PGDA, LOLA South Pole landing-site DEMs (5 m/px)",
        "url": "https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/",
    },
    {
        "label": "NASA PGDA, LOLA 80S 80 m/px regional DEM",
        "url": "https://pgda.gsfc.nasa.gov/products/90",
    },
    {
        "label": "NASA/JPL Horizons system (DE441), observer ephemerides",
        "url": "https://ssd.jpl.nasa.gov/horizons/",
    },
]


@dataclass(frozen=True)
class ExtraSite:
    id: str
    name: str
    short_name: str
    lat_deg: float
    lon_east_deg: float
    description: str


EXTRA_SITES: tuple[ExtraSite, ...] = (
    ExtraSite(
        id="nobile_rim_1",
        name="Nobile Rim 1",
        short_name="Nobile Rim 1",
        lat_deg=-85.2,
        lon_east_deg=36.1,
        description=(
            "Nobile crater rim candidate at 85.2 S, 36.1 E, on the high polar plateau west of Nobile "
            "where the DEM shows broad, rough highland relief rather than a single crater wall. "
            "Terrain data here is the regional 80 m/px LOLA DEM only (no 5 m/px near-field coverage), "
            "so the horizon is a 100 km regional profile sampled every 80 m."
        ),
    ),
    ExtraSite(
        id="haworth_rim",
        name="Haworth Rim",
        short_name="Haworth Rim",
        lat_deg=-87.4,
        lon_east_deg=354.8,
        description=(
            "Haworth crater candidate at 87.4 S, 354.8 E; on the regional 80 m/px LOLA DEM this "
            "coordinate lies inside the Haworth basin, whose walls dominate the skyline over most "
            "azimuths. Terrain data here is the regional 80 m/px LOLA DEM only (no 5 m/px near-field "
            "coverage), so the horizon is a 100 km regional profile sampled every 80 m."
        ),
    ),
)


# --- raster helpers ---------------------------------------------------------
def bilinear(arr: np.ndarray, transform, x: np.ndarray, y: np.ndarray) -> np.ndarray:
    """Bilinear sample of a raster at projected coordinates (NaN-safe)."""
    inverse = ~transform
    cols, rows = inverse * (x, y)
    fc = cols - 0.5
    fr = rows - 0.5
    height, width = arr.shape
    c0 = np.floor(fc).astype(np.int64)
    r0 = np.floor(fr).astype(np.int64)
    inside = (c0 >= 0) & (r0 >= 0) & (c0 < width - 1) & (r0 < height - 1)
    c0c = np.clip(c0, 0, width - 2)
    r0c = np.clip(r0, 0, height - 2)
    fx = fc - c0
    fy = fr - r0
    z00 = arr[r0c, c0c].astype(np.float64)
    z10 = arr[r0c, c0c + 1].astype(np.float64)
    z01 = arr[r0c + 1, c0c].astype(np.float64)
    z11 = arr[r0c + 1, c0c + 1].astype(np.float64)
    w00 = (1 - fx) * (1 - fy)
    w10 = fx * (1 - fy)
    w01 = (1 - fx) * fy
    w11 = fx * fy
    valid = inside & np.isfinite(z00) & np.isfinite(z10) & np.isfinite(z01) & np.isfinite(z11)
    numerator = (
        w00 * np.nan_to_num(z00)
        + w10 * np.nan_to_num(z10)
        + w01 * np.nan_to_num(z01)
        + w11 * np.nan_to_num(z11)
    )
    return np.where(valid, numerator, np.nan)


def read_window_around(dataset, x0: float, y0: float, radius_m: float):
    inverse = ~dataset.transform
    corners = [
        inverse * (x0 - radius_m, y0 - radius_m),
        inverse * (x0 + radius_m, y0 + radius_m),
    ]
    cols = [point[0] for point in corners]
    rows = [point[1] for point in corners]
    col_min = max(0, int(math.floor(min(cols))))
    col_max = min(dataset.width, int(math.ceil(max(cols))))
    row_min = max(0, int(math.floor(min(rows))))
    row_max = min(dataset.height, int(math.ceil(max(rows))))
    window = Window(col_min, row_min, max(1, col_max - col_min), max(1, row_max - row_min))
    array = dataset.read(1, window=window).astype(np.float32)
    if dataset.nodata is not None and np.isfinite(dataset.nodata):
        array = np.where(array == np.float32(dataset.nodata), np.float32(np.nan), array)
    return array, dataset.window_transform(window)


def pole_planar_north_angle(crs, x0: float, y0: float) -> float:
    """Planar angle (from +y, clockwise) of the projected pole as seen from the site.

    Polar stereographic meridians are straight lines through the projected
    pole, so the pole direction is exactly the meridian direction.  This is
    ``pipeline/build_horizons.py``'s ``pole_planar_north_angle`` verbatim: it
    treats the pole direction as "north", which for a southern site is
    geographic south (hence the 180 deg azimuth origin handled by
    ``--north-mode``).
    """
    pole_x, pole_y = warp_transform(GEOGRAPHIC_CRS, crs, [0.0], [-90.0])
    return math.atan2(pole_x[0] - x0, pole_y[0] - y0)


def local_elevation_m(arr: np.ndarray, transform, x0: float, y0: float) -> tuple[float, int]:
    """Median elevation of a small patch around the site (NoData-safe)."""
    cols, rows = (~transform) * (x0, y0)
    centre_col = int(round(cols - 0.5))
    centre_row = int(round(rows - 0.5))
    half = ELEVATION_PATCH_PX // 2
    height, width = arr.shape
    used = 0
    # Grow the search radius until at least one finite value is found.
    for grow in range(0, 21):
        col_lo = max(0, centre_col - half - grow)
        col_hi = min(width, centre_col + half + 1 + grow)
        row_lo = max(0, centre_row - half - grow)
        row_hi = min(height, centre_row + half + 1 + grow)
        patch = arr[row_lo:row_hi, col_lo:col_hi].astype(np.float64)
        finite = patch[np.isfinite(patch)]
        used = int(finite.size)
        if used > 0:
            return float(np.median(finite)), used
    raise SystemExit("No valid DEM elevation found around the site centre")


def local_plane_slope_deg(
    arr: np.ndarray, transform, x0: float, y0: float, radius_px: int = SLOPE_WINDOW_PX // 2
) -> tuple[float, float]:
    """Least-squares plane fit slope (deg) plus median per-pixel gradient slope (deg)."""
    cols, rows = (~transform) * (x0, y0)
    centre_col = int(round(cols - 0.5))
    centre_row = int(round(rows - 0.5))
    height, width = arr.shape
    col_lo = max(0, centre_col - radius_px)
    col_hi = min(width, centre_col + radius_px + 1)
    row_lo = max(0, centre_row - radius_px)
    row_hi = min(height, centre_row + radius_px + 1)
    patch = arr[row_lo:row_hi, col_lo:col_hi].astype(np.float64)
    if patch.size < 9:
        return 0.0, 0.0

    resolution_x = float(transform.a)
    resolution_y = float(-transform.e)
    valid = np.isfinite(patch)
    if np.count_nonzero(valid) < 9:
        return 0.0, 0.0

    # Plane fit: z = a * x + b * y + c, coordinates in metres about the patch centre.
    yy, xx = np.mgrid[0 : patch.shape[0], 0 : patch.shape[1]]
    x_m = (xx - (patch.shape[1] - 1) / 2.0) * resolution_x
    y_m = ((patch.shape[0] - 1) / 2.0 - yy) * resolution_y
    design = np.column_stack([x_m[valid], y_m[valid], np.ones(np.count_nonzero(valid))])
    coefficients, *_ = np.linalg.lstsq(design, patch[valid], rcond=None)
    plane_slope = math.degrees(math.atan(math.hypot(coefficients[0], coefficients[1])))

    # Cross-check: median of per-pixel central-difference slopes over the same window.
    filled = np.where(valid, patch, np.nanmedian(patch[valid]))
    grad_row, grad_col = np.gradient(filled, resolution_y, resolution_x)
    gradient_slope = np.degrees(np.arctan(np.hypot(grad_row, grad_col)))
    median_gradient_slope = float(np.median(gradient_slope[valid])) if np.any(valid) else 0.0

    return float(plane_slope), median_gradient_slope


# --- horizon construction ---------------------------------------------------
def build_regional_horizon(
    site: ExtraSite, dem_path: Path, azimuth_block: int = 120, north_mode: str = "pole"
) -> tuple[dict, dict, dict]:
    azimuths = np.arange(HORIZON_BIN_COUNT, dtype=np.float64) * HORIZON_BIN_WIDTH_DEG
    radii_m = np.arange(
        FAR_SAMPLE_STEP_M,
        FAR_FIELD_RADIUS_KM * 1000.0 + FAR_SAMPLE_STEP_M,
        FAR_SAMPLE_STEP_M,
    )
    with rasterio.open(dem_path) as dataset:
        lon = [float(site.lon_east_deg)]
        lat = [float(site.lat_deg)]
        x_list, y_list = warp_transform(GEOGRAPHIC_CRS, dataset.crs, lon, lat)
        x0, y0 = float(x_list[0]), float(y_list[0])
        pole_angle = pole_planar_north_angle(dataset.crs, x0, y0)
        north_angle = pole_angle if north_mode == "pole" else pole_angle + math.pi
        window_array, window_transform = read_window_around(
            dataset, x0, y0, FAR_FIELD_RADIUS_KM * 1000.0 + 2000.0
        )
        crs_wkt = dataset.crs.to_string()

    elevation_m, patch_pixels = local_elevation_m(window_array, window_transform, x0, y0)
    slope_deg, median_gradient_slope = local_plane_slope_deg(window_array, window_transform, x0, y0)

    rows = np.full((MAST_HEIGHTS_M.size, HORIZON_BIN_COUNT), -90.0)
    dominant = np.zeros(HORIZON_BIN_COUNT)
    curvature_m = radii_m**2 / (2.0 * LUNAR_RADIUS_M)
    minimum_radius_by_height = np.maximum(25.0, 4.0 * MAST_HEIGHTS_M)
    samples_used = 0
    samples_total = 0

    for start in range(0, HORIZON_BIN_COUNT, azimuth_block):
        stop = min(HORIZON_BIN_COUNT, start + azimuth_block)
        block_azimuths = azimuths[start:stop]
        psi = north_angle + np.radians(block_azimuths)[:, None]
        x = x0 + radii_m[None, :] * np.sin(psi)
        y = y0 + radii_m[None, :] * np.cos(psi)
        terrain = bilinear(window_array, window_transform, x, y)  # (block, n_radii), NaN = NoData
        samples_total += terrain.size
        samples_used += int(np.count_nonzero(np.isfinite(terrain)))

        with np.errstate(invalid="ignore", divide="ignore"):
            angle = np.arctan(
                (terrain - elevation_m - MAST_HEIGHTS_M[:, None, None] - curvature_m[None, None, :])
                / radii_m[None, None, :]
            )
            angle = np.where(
                radii_m[None, None, :] < minimum_radius_by_height[:, None, None], -np.inf, angle
            )
        angle = np.where(np.isfinite(angle), angle, -np.inf)
        angle = np.maximum(angle, -math.pi / 2.0)
        block_max = np.max(angle, axis=2)  # (n_heights, block)
        rows[:, start:stop] = np.degrees(block_max)
        height_index = 1  # 2.0 m row drives dominantDistanceKm
        dominant[start:stop] = radii_m[np.argmax(angle[height_index], axis=1)]

    # Datum/elevation guard: bins with no valid sample anywhere fall back to -90 deg.
    rows = np.where(np.isfinite(rows), rows, -90.0)
    # Raising the observer cannot worsen the horizon.
    for index in range(1, MAST_HEIGHTS_M.size):
        rows[index] = np.minimum(rows[index], rows[index - 1])

    rows = np.round(rows, 4)
    dominant_km = np.round(dominant / 1000.0, 3)

    notes = (
        "Regional LOLA profile: 80 m/px LDEM_80S_80MPP_ADJ.TIF sampled radially from "
        f"{FAR_SAMPLE_STEP_M:.0f} m out to {FAR_FIELD_RADIUS_KM:.0f} km; no 5 m/px near-field DEM "
        "is available for this site, so the profile has 80 m/px resolution at all ranges "
        "(sub-kilometre relief within the first pixel is not resolved). Curvature term "
        "r^2/(2R_Moon) applied inside the arctangent with R_Moon = 1737400 m; 0.5 deg bins. "
        + (
            "Azimuth bins follow pipeline/build_horizons.py: bin k points at the meridian "
            "direction toward the lunar south pole, i.e. compass azimuth (k * 0.5 + 180) deg, "
            "the same origin as the seven existing site profiles. "
            if north_mode == "pole"
            else "Azimuth bins are geographic compass azimuths (0 = true north, 90 = east). "
        )
        + "Site elevation is the 5x5 pixel median of the same DEM; no near/far datum offset is "
        "estimated because there is no overlapping 5 m/px surface."
    )

    horizon = {
        "schemaVersion": 1,
        "siteId": site.id,
        "generatedUtc": utc_now_iso(),
        "provenance": PROVENANCE,
        "binCount": HORIZON_BIN_COUNT,
        "binWidthDeg": HORIZON_BIN_WIDTH_DEG,
        "mastHeightsM": [float(h) for h in MAST_HEIGHTS_M],
        "elevationsDegByHeight": rows.tolist(),
        "dominantDistanceKm": dominant_km.tolist(),
        "sourceTier": ["far_80m"] * HORIZON_BIN_COUNT,
        "siteElevationM": round(elevation_m, 2),
        "nearFieldRadiusKm": 0.0,
        "farFieldRadiusKm": FAR_FIELD_RADIUS_KM,
        "notes": notes,
    }

    site_metadata = {
        "id": site.id,
        "name": site.name,
        "shortName": site.short_name,
        "regionType": "polar",
        "latDeg": float(site.lat_deg),
        "lonEastDeg": float(site.lon_east_deg),
        "elevationM": round(elevation_m, 2),
        "slopeDeg": round(slope_deg, 3),
        "demSourceNear": DEM_BASENAME,
        "demSourceFar": DEM_BASENAME,
        "description": site.description,
        "citations": CITATIONS,
        "horizonMode": HORIZON_MODE,
        "nearFieldRadiusKm": 0.0,
        "farFieldRadiusKm": FAR_FIELD_RADIUS_KM,
        "optimalPanelAzimuthDeg": 0.0,
        "dataQuality": "LOLA 80 m/px regional",
        "horizonSource": "lola_80m_regional",
        "ephemSource": "iau2000_local",
        "role": "candidate",
        "horizonFile": f"horizon/{site.id}.json",
    }

    diagnostics = {
        "siteId": site.id,
        "x": x0,
        "y": y0,
        "crs": crs_wkt,
        "northAngleDeg": math.degrees(north_angle) % 360.0,
        "poleAngleDeg": math.degrees(pole_angle) % 360.0,
        "northMode": north_mode,
        "windowShape": list(window_array.shape),
        "elevationPatchPixels": patch_pixels,
        "medianGradientSlopeDeg": median_gradient_slope,
        "radiusSamples": int(radii_m.size),
        "radialSamplesValid": samples_used,
        "radialSamplesTotal": samples_total,
    }
    return horizon, site_metadata, diagnostics


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def write_json(path: Path, payload: object, compact: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = (
        json.dumps(payload, separators=(",", ":"), ensure_ascii=False, allow_nan=False)
        if compact
        else json.dumps(payload, indent=2, ensure_ascii=False, allow_nan=False)
    )
    path.write_text(text, encoding="utf-8")


# --- verification -----------------------------------------------------------
def verify_horizon(path: Path) -> dict:
    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload["elevationsDegByHeight"]
    assert payload["schemaVersion"] == 1, path
    assert payload["binCount"] == HORIZON_BIN_COUNT, path
    assert payload["binWidthDeg"] == HORIZON_BIN_WIDTH_DEG, path
    assert payload["provenance"] == PROVENANCE, path
    assert payload["nearFieldRadiusKm"] == 0, path
    assert payload["farFieldRadiusKm"] == FAR_FIELD_RADIUS_KM, path
    assert len(payload["mastHeightsM"]) == 5, path
    assert len(rows) == 5, path
    assert all(len(row) == HORIZON_BIN_COUNT for row in rows), path
    assert len(payload["dominantDistanceKm"]) == HORIZON_BIN_COUNT, path
    assert payload["sourceTier"] == ["far_80m"] * HORIZON_BIN_COUNT, path
    array = np.asarray(rows, dtype=np.float64)
    assert np.all(np.isfinite(array)), f"{path}: non-finite horizon value"
    assert np.all(np.isfinite(np.asarray(payload["dominantDistanceKm"], dtype=np.float64))), path
    # Monotonic in mast height: a higher mast cannot raise the horizon.
    for index in range(1, array.shape[0]):
        assert np.all(array[index] <= array[index - 1] + 1e-12), (
            f"{path}: row {index} exceeds row {index - 1}"
        )
    two_metre = array[1]
    return {
        "siteId": payload["siteId"],
        "min": float(two_metre.min()),
        "max": float(two_metre.max()),
        "mean": float(two_metre.mean()),
        "siteElevationM": payload["siteElevationM"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dem", type=Path, default=DEFAULT_DEM, help="LOLA 80 m/px regional DEM")
    parser.add_argument("--site", help="Build a single site id (for debugging)")
    parser.add_argument(
        "--north-mode",
        choices=("pole", "true"),
        default="true",
        help=(
            "'true' (default) uses geographic compass azimuths (0 = north). 'pole' reproduces "
            "pipeline/build_horizons.py, whose azimuth 0 points at the lunar south pole "
            "(compass azimuth 180) and is kept only for provenance/sensitivity comparisons."
        ),
    )
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=None,
        help="Override the public/data output directory (nothing in the project is touched)",
    )
    args = parser.parse_args()

    dem_path = args.dem
    if not dem_path.exists():
        raise SystemExit(f"Missing DEM: {dem_path}")

    public_dir = args.out_dir if args.out_dir is not None else PUBLIC_DATA
    horizon_dir = public_dir / "horizon" if args.out_dir is not None else HORIZON_DIR
    horizon_dir.mkdir(parents=True, exist_ok=True)
    site_records: list[dict] = []
    stats: list[dict] = []
    for site in EXTRA_SITES:
        if args.site and site.id != args.site:
            continue
        horizon, metadata, diagnostics = build_regional_horizon(
            site, dem_path, north_mode=args.north_mode
        )
        horizon_path = horizon_dir / f"{site.id}.json"
        write_json(horizon_path, horizon, compact=True)
        site_records.append(metadata)
        summary = verify_horizon(horizon_path)
        stats.append(summary)
        print(
            f"{site.id}: elevation {summary['siteElevationM']:.2f} m, slope {metadata['slopeDeg']:.3f} deg "
            f"(median gradient {diagnostics['medianGradientSlopeDeg']:.3f} deg), "
            f"pole angle {diagnostics['poleAngleDeg']:.3f} deg, azimuth origin {args.north_mode}, "
            f"2 m horizon min/mean/max "
            f"{summary['min']:.3f}/{summary['mean']:.3f}/{summary['max']:.3f} deg, "
            f"valid radial samples {diagnostics['radialSamplesValid']}/{diagnostics['radialSamplesTotal']}"
        )

    if not args.site:
        write_json(
            public_dir / "sites-extra.json",
            {
                "schemaVersion": 1,
                "generatedUtc": utc_now_iso(),
                "dataMode": "real",
                "sites": site_records,
            },
        )
        print(f"Wrote {public_dir / 'sites-extra.json'} ({len(site_records)} sites)")

    print(f"Verified {len(stats)} horizon file(s) in {horizon_dir}")


if __name__ == "__main__":
    main()
