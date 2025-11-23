# Triage Report - Regression Fixes
**Status:** [CRITICAL REGRESSION]
**Focus:** Restore Right Sidebar & Fix Add Tool

## 🛑 P0: Right Sidebar Frozen (Showstopper)
**Issue:** The entire Right Sidebar (Basics, Coverage, Generate Path) is inactive.
**Symptoms:**
*   Inputs are rendered but values cannot be changed (Read-only or Event disconnected).
*   "Generate Path" button is dead.
*   **Hypothesis:** The Store might be stuck in a `loading` or `generating` state, or the Builder accidentally wrapped the Sidebar in a generic `disabled={true}` logic while trying to implement "Edit Mode."

## 🛑 P1: Add Waypoint Tool Broken
**Issue:** The new "Add Waypoint" tool is non-functional.
**Symptoms:**
*   **Visual:** Clicking the icon does NOT highlight it blue (State not updating).
*   **Logic:** Clicking the map does NOT drop a teardrop/marker.
*   **Hypothesis:** The `onClick` handler in `DrawToolbar` isn't setting the active mode correctly, OR the MapContainer isn't listening for the `click` event when this specific mode is active.

**Files to Investigate:**
*   `@src/store/useMissionStore.js` (Check for broken selectors or stuck boolean flags).
*   `@src/components/Sidebar/SidebarMain.jsx` (Check why inputs are blocked).
*   `@src/components/Map/DrawToolbar.jsx` (Check active state logic).