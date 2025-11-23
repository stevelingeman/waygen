# Triage Report - Waygen UI
**Date:** 2025-11-23
**Status:** [CRITICAL BLOCKER]
**Focus:** Mapbox Drawing Tools (Top-Left Overlay)

## 🛑 P0: Critical Showstopper (Fix Immediately)
**Issue:** Drawing tools are duplicated and non-functional.
**Context:** inside the Mapbox container (top-left), we see confusing/duplicate drawing menus. Clicking the icons fails to switch the map into "Draw Mode."

**Specific Symptoms:**
*   [ ] **Duplicate Controls:** Identify why there are multiple sets of drawing icons. Check if `map.addControl(draw)` is being called with `displayControlsDefault: true` while we are also rendering a custom `DrawToolbar`.
*   [ ] **Event Detachment:** The visible buttons might be "Zombie" buttons—rendered by React but not actually connected to the current Mapbox `draw` instance.
*   [ ] **Activation Failure:** Clicking the Polygon icon does not trigger `draw.changeMode('draw_polygon')`.

**Files to Investigate:**
*   `@src/components/Map/MapContainer.jsx` (Look for `new MapboxDraw(...)`)
*   `@src/components/Map/DrawToolbar.jsx` (Look for how these buttons are rendered)

## ✅ Success Criteria
1.  **Visual:** Only ONE set of drawing tools is visible on the map (the correct custom set).
2.  **Functional:** Clicking "Polygon" immediately changes the cursor to a crosshair.
3.  **Cleanup:** No duplicate default Mapbox buttons are hiding behind or next to our custom ones.