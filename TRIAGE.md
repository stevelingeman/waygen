# Triage Report - Waygen UI
**Date:** 2025-11-23
**Status:** [UX POLISH]
**Focus:** Toolbar Feedback & Cursor Interaction

## ⚠️ P1: Active State Feedback
**Issue:** The selected tool button does not highlight blue.
**Context:** Users don't know which tool is active.
**Fix Requirement:**
*   The `DrawToolbar` component needs to track the active mode.
*   We need to listen to the Mapbox event `draw.modechange` to update the local state in React.
*   Apply the `bg-blue-500` (or similar) class to the active button.

## 🛑 P0: Square Tool Interaction Conflict
**Issue:** "Square" tool activates, but clicking pans the map instead of drawing.
**Context:** The Custom Mode (`DragRectangleMode`) is likely failing to stop the event propagation or disable map dragging.
**Fix Requirement:**
*   Ensure that when "Square" mode is active, `map.dragPan.disable()` is called (or the custom mode handles the drag event exclusively).
*   Verify `onClick` in the custom mode logic stops propagation.

## ⚠️ P2: Circle Tool Cursor
**Issue:** "Circle" tool shows the "Grab" (White Glove) cursor instead of Crosshairs.
**Context:** Functional, but confusing.
**Fix Requirement:**
*   Force the CSS cursor to `crosshair` when the map mode is `draw_circle` (or whatever the custom circle mode is named).
*   Check if the custom mode needs to explicitly add a class to the map container.

**Files to Investigate:**
*   `@src/components/Map/DrawToolbar.jsx` (Button state)
*   `@src/components/Map/MapContainer.jsx` (Event listeners)
*   `@src/logic/DragRectangleMode.js` (Square logic)