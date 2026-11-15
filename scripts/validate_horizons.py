"""Cross-DEM terrain validation for the hybrid LOLA horizons.

For each of the six sites with a 5 m/px landing-site DEM, this script builds
the horizon twice over the *same* near-field radial range (25 m to the local
DEM radius) and at the same 24 azimuths:

* once from the 5 m/px landing-site DEM;
* once from the 80 m/px regional LOLA DEM.

Both use the same 2 m mast, the lunar curvature term r^2 / (2 R_Moon), the
same site elevation and the near/far datum offset estimated in the overlap
ring. The output reports the absolute angular difference per site.

This is a cross-product agreement check between two LOLA DEM products, not an
absolute accuracy claim: neither product resolves rocks below its pixel size,
and both are derived from LOLA measurements.

Usage:
    python scripts/validate_horizons.py

Requires numpy and rasterio, plus the pipeline DEMs under ../pipeline/data/dem.
"""

from __future__ import annotations

import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import rasterio

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PIPELINE_DIR = PROJECT_ROOT.parent / "pipeline"
sys.path.insert(0, str(PIPELINE_DIR))

from build_horizons import (  # noqa: E402
    bilinear,
    estimate_far_offset,
    pole_planar_north_angle,
    read_window_around,
)
from common import DEM_DIR, LUNAR_RADIUS_M, SITE_BY_ID  # noqa: E402

AZIMUTH_COUNT = 24
AZIMUTH_STEP_DEG = 360.0 / AZIMUTH_COUNT
MAST_HEIGHT_M = 2.0
MIN_RADIUS_M = 25.0
SAMPLE_STEP_M = 5.0
FAR_DEM_PATH = DEM_DIR / "LDEM_80S_80MPP_ADJ.TIF"
METADATA_PATH = PIPELINE_DIR / "data" / "dem_metadata.json"
OUTPUT_PATH = PROJECT_ROOT / "public" / "data" / "terrain-validation.json"


def horizon_angles(
    dem: np.ndarray,
    transform,
    x0: float,
    y0: float,
    north_angle_rad: float,
    azimuths_deg: np.ndarray,
    radii_m: np.ndarray,
    z0_m: float,
) -> np.ndarray:
    psi = north_angle_rad + np.radians(azimuths_deg)[:, None]
    x = x0 + radii_m[None, :] * np.sin(psi)
    y = y0 + radii_m[None, :] * np.cos(psi)
    terrain = bilinear(dem, transform, x, y)
    with np.errstate(invalid="ignore", divide="ignore"):
        angles = np.arctan(
            (
                terrain
                - z0_m
                - MAST_HEIGHT_M
                - radii_m[None, :] ** 2 / (2.0 * LUNAR_RADIUS_M)
            )
            / radii_m[None, :]
        )
    angles = np.where(np.isfinite(angles), angles, -np.inf)
    return np.degrees(np.max(angles, axis=1))


def summarize(values: np.ndarray) -> dict:
    values = np.asarray(values, dtype=np.float64)
    return {
        "samples": int(values.size),
        "meanAbsDeg": round(float(np.mean(values)), 4),
        "rmsDeg": round(float(np.sqrt(np.mean(values**2))), 4),
        "maxDeg": round(float(np.max(values)), 4),
        "p95Deg": round(float(np.percentile(values, 95)), 4),
    }


def main() -> None:
    if not FAR_DEM_PATH.exists():
        raise SystemExit(f"Missing regional DEM: {FAR_DEM_PATH}")
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    azimuths = np.arange(AZIMUTH_COUNT, dtype=np.float64) * AZIMUTH_STEP_DEG

    site_results: list[dict] = []
    all_differences: list[np.ndarray] = []
    near_field_radii_km: list[float] = []

    for info in metadata["sites"]:
        site_id = info["siteId"]
        near_path = DEM_DIR / info["demFile"]
        if not near_path.exists():
            raise SystemExit(f"Missing near-field DEM: {near_path}")

        near_radius_m = float(info["nearFieldRadiusKm"]) * 1000.0
        near_field_radii_km.append(near_radius_m / 1000.0)
        radii_m = np.arange(MIN_RADIUS_M, near_radius_m + SAMPLE_STEP_M, SAMPLE_STEP_M)
        radii_m = radii_m[radii_m <= near_radius_m]
        z0_m = float(info["elevationM"])

        with rasterio.open(near_path) as near_ds:
            near = near_ds.read(1).astype(np.float32)
            near_transform = near_ds.transform
            x0, y0 = near_transform * (near_ds.width / 2.0, near_ds.height / 2.0)
            # The app uses geographic compass azimuths: rotate the pole-facing
            # source convention by 180 degrees. Both DEMs use this same angle.
            north_angle = pole_planar_north_angle(near_ds.crs, x0, y0) + math.pi
            near_angles = horizon_angles(
                near,
                near_transform,
                x0,
                y0,
                north_angle,
                azimuths,
                radii_m,
                z0_m,
            )

        with rasterio.open(FAR_DEM_PATH) as far_ds:
            far, far_transform = read_window_around(
                far_ds, x0, y0, near_radius_m + 2000.0
            )
            offset = estimate_far_offset(
                near, near_transform, far, far_transform, x0, y0, near_radius_m
            )
            if abs(offset) > 0.5:
                far = far + np.float32(offset)
            far_angles = horizon_angles(
                far,
                far_transform,
                x0,
                y0,
                north_angle,
                azimuths,
                radii_m,
                z0_m,
            )

        valid = np.isfinite(near_angles) & np.isfinite(far_angles)
        if not np.all(valid):
            print(f"{site_id}: {int(np.count_nonzero(~valid))} invalid azimuth(s)")
        difference = np.abs(near_angles[valid] - far_angles[valid])
        all_differences.append(difference)
        summary = summarize(difference)
        max_index = int(np.argmax(difference))
        site = SITE_BY_ID.get(site_id)
        record = {
            "siteId": site_id,
            "siteShortName": site.short_name if site is not None else site_id,
            "azimuthSamples": int(difference.size),
            "azimuthStepDeg": AZIMUTH_STEP_DEG,
            "nearFieldRadiusKm": round(near_radius_m / 1000.0, 2),
            "datumOffsetM": round(offset, 2),
            **summary,
            "maxAzimuthDeg": round(
                float(azimuths[valid][max_index]), 1
            ),
        }
        site_results.append(record)
        print(
            f"{site_id:8s} RMS={record['rmsDeg']:.3f} deg "
            f"mean={record['meanAbsDeg']:.3f} max={record['maxDeg']:.3f} "
            f"at az={record['maxAzimuthDeg']:.0f} deg "
            f"(offset {record['datumOffsetM']:+.1f} m)"
        )

    aggregate = summarize(np.concatenate(all_differences))
    payload = {
        "schemaVersion": 1,
        "generatedUtc": datetime.now(timezone.utc)
        .replace(microsecond=0)
        .isoformat()
        .replace("+00:00", "Z"),
        "method": "near_5m_vs_regional_80m_same_radial_range",
        "azimuthSamples": AZIMUTH_COUNT,
        "azimuthStepDeg": AZIMUTH_STEP_DEG,
        "mastHeightM": MAST_HEIGHT_M,
        "sampleStepM": SAMPLE_STEP_M,
        "minimumRadiusM": MIN_RADIUS_M,
        "nearFieldMinKm": round(min(near_field_radii_km), 2),
        "nearFieldMaxKm": round(max(near_field_radii_km), 2),
        "curvatureTerm": "r^2/(2R), R=1737400 m",
        "aggregate": aggregate,
        "sites": site_results,
        "notes": (
            "Cross-DEM agreement between the 5 m/px landing-site DEM and the 80 m/px "
            "regional LOLA DEM over the same near-field radial range, 24 azimuths and "
            "a 2 m mast. Values are absolute horizon-angle differences in degrees. "
            "This is not an absolute terrain-accuracy claim: both products derive from "
            "LOLA and do not resolve rocks below their pixel size."
        ),
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print(
        f"\nAggregate: {aggregate['samples']} azimuth comparisons, "
        f"RMS {aggregate['rmsDeg']:.3f} deg, max {aggregate['maxDeg']:.3f} deg"
    )
    print(f"Wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
