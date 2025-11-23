# TRIAGE REPORT: Waygen Critical Fixes
**Date:** 2025-11-23
**Status:** URGENT

## 🚨 CRITICAL: Photogrammetry Overlap Failure
**Issue:** The "Overlap" slider currently acts only as a "Side Overlap" (distance between flight strips). It does not affect "Front Overlap" (distance between waypoints).
**Impact:** Missions generated with high overlap settings (e.g., 80%) will fail image stitching because the drone is taking photos too far apart along the path.

### The Fix (Mathematical)
The Waypoint Generation Loop must utilize the overlap percentage to calculate the longitudinal distance between points.

**Current Logic (Presumed):**
`dist_between_points = ground_image_height` (0% overlap)

**Required Logic:**
1. Calculate Ground Height:
   $$Height_{ground} = (2 * Altitude * \tan(HFOV / 2)) * (3 / 4)$$
2. Calculate Interval:
   $$Interval = Height_{ground} * (1 - (OverlapPercentage / 100))$$

**Action Items:**
- [ ] Locate the waypoint generation iterator (likely where vectors are normalized).
- [ ] Inject the `Interval` formula above to control spacing between nodes.
- [ ] **Verification:** When the Overlap slider moves to 80%, the total number of waypoints (count) should drastically increase (~5x).

---

## ⚠️ VISUALIZATION: Map Obscuration
**Issue:** The footprint visualization uses a 4-color rainbow cycle at 30% opacity. This creates "muddy" colors when overlapping and hides the satellite map, reducing pilot situational awareness.

### The Fix (Style Update)
Switch from "Distinct Indices" to "Heatmap Density" using Alpha Stacking.

**Specs:**
- [ ] **Fill Color:** Static Cyan/Blue (e.g., `#00a1e4`).
- [ ] **Fill Opacity:** Reduce to `0.1` or `0.15`.
- [ ] **Stroke (Border):** Solid, 1px width, Opacity `0.6`.
- [ ] **Hover Effect (Optional):** Hovering a waypoint highlights *only* that specific footprint in Orange (`#ff8c00`, 0.5 opacity).

**Benefit:**
*   Single layer = Light Blue (1 photo).
*   Overlap layer = Dark Blue (Multiple photos).
*   Satellite imagery remains visible through the grid.

---

## 🧬 NEXT STEPS (Post-Triage)
Once the math is fixed, we should split the UI control:
1.  **Side Overlap Slider** (Controls strip width).
2.  **Front Overlap Slider** (Controls shutter interval).
*Most pros fly 70% Side / 80% Front.*