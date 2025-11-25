# Triage: Waypoint Visibility & Layering Issue

**Date:** 2025-11-25
**Status:** Active
**Priority:** High

## 1. Issue Description
Users report that waypoints are not visible on the map, neither when generated from a shape nor when imported from a KMZ.
- **Visible:** Map tiles, Sidebar menu (populated correctly), Footprints, drawn polygon
- **Invisible:** Waypoints (Teardrop icons), Mission Path (Blue line), imported polygon
- **Context:** The user suspects a "Z-layer issue".

## 2. Recent Changes
- Implemented session storage/restoration.
- Optimized `vite.config.js` for code splitting (performance).
- Refactored `MapContainer.jsx` initialization logic to handle `map.loaded()` state.
- Reverted complex layer ordering logic that used `beforeId`.

## 3. Hypotheses

### A. Race Condition (Map Load vs. Data Update)
- **Hypothesis:** The `waypoints` source data is being set *before* the source is added to the map, or the `useEffect` that updates the source is firing before the map is ready.
- **Status:** Partially addressed by checking `map.loaded()`, but needs verification.

### B. Image Loading Timing
- **Hypothesis:** The `waypoints-symbol` layer uses `icon-image: 'teardrop'`. If this image hasn't finished loading via `map.addImage` before the layer is rendered, the icons won't show.
- **Status:** Plausible. The `loadIcon` function is async (`img.onload`).

### C. Layer Z-Index / Ordering
- **Hypothesis:** The `waypoints-symbol` layer is being added, but it's physically below the satellite raster layer or the MapboxDraw polygon fill.
- **Status:** Unlikely to be below satellite (which is usually bottom), but could be below Draw layers if not carefully ordered. However, `symbol` layers usually render on top.

### D. Style/Layout Properties
- **Hypothesis:** A layout property like `icon-allow-overlap: false` combined with a collision might be hiding them. Or `icon-size` is 0.
- **Status:** `icon-allow-overlap` is set to `true`.

## 4. Debugging Plan

1.  **Verify Source Data:**
    - Log `map.getSource('waypoints').getData()` in the console to ensure features exist.

2.  **Verify Layer Existence:**
    - Log `map.getLayer('waypoints-symbol')` to confirm the layer was actually added.

3.  **Verify Image Loading:**
    - Log when `teardrop` image is actually added to the map.

4.  **Force Layer Order:**
    - Try moving the `waypoints-symbol` layer explicitly to the end of the style array using `map.moveLayer()`.

5.  **Simplify Layer:**
    - Temporarily change `waypoints-symbol` to a `circle` type layer (which doesn't need an image) to rule out image loading issues.

## 5. Action Items
- [ ] Add extensive logging for Source/Layer/Image status.
- [ ] Test fallback to `circle` layer.
- [ ] Check if `useEffect` for data updates is being skipped due to missing `map.current`.
