# Triage Report - Sidebar Cleanup
**Status:** [UX REFACTOR]
**Focus:** Coverage Settings & Defaults

## 1. Orbit Mode Cleanup
**Issue:** The "Circle Radius" input and "Create" button are redundant and confusing. Users should draw the circle using the Toolbar, not type a number.
**Requirements:**
*   **Remove:** When `Path Type` is 'Orbit', DO NOT render the "Circle Radius" input or the "Create" button.
*   **Logic Check:** Ensure the Path Generator calculates the radius/path based on the **drawn geometry** (the polygon/circle on the map), not this removed input field.

## 2. Default Value Adjustments
**Issue:** Initial settings are not optimized for the standard workflow.
**Requirements:**
*   **Path Type:** Default to `Grid` (instead of Orbit) on app load.
*   **Orbit Spacing:** If the user switches to Orbit, the default `spacing` should be **10 meters** (currently 20).

**Files to Investigate:**
*   `@src/components/Sidebar/SidebarCoverage.jsx` (or similar file where the inputs render).
*   `@src/store/useMissionStore.js` (Where initial state is defined).