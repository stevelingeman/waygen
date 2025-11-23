# Triage Report - Waygen UI
**Date:** 2025-11-23
**Status:** [PARTIAL FIX]
**Focus:** "Draw Square" Tool Logic

## 🛑 P0: Custom Mode Failure
**Issue:** The "Draw Square" (Rectangle) button is unresponsive.
**Context:** Visual overlap is fixed, but clicking the "Square" icon likely does nothing or throws an error. This is a **Custom Mapbox Mode**, not a default one.

**Specific Symptoms:**
*   [ ] **Mode Registration:** Check if `DragRectangleMode` is imported and actually added to the `modes` object inside `new MapboxDraw({...})`.
*   [ ] **Trigger Name:** The button click is likely calling `draw.changeMode('draw_rectangle')`. Verify that 'draw_rectangle' matches exactly the key used in the config.
*   [ ] **Console Errors:** Check for "Error: Unknown mode: draw_rectangle" when clicking the button.

**Files to Investigate:**
*   `@src/components/Map/MapContainer.jsx` (Initialization config)
*   `@src/logic/DragRectangleMode.js` (The custom logic)
*   `@src/components/Map/DrawToolbar.jsx` (The button trigger)

## ✅ Success Criteria
1.  Clicking "Square" icon changes cursor.
2.  Click-and-drag (or click-click) creates a generic rectangular polygon.
3.  The shape is accepted as valid input for path generation.