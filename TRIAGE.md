# Triage: Generate Path Fails after Import

## Issue Description
After importing a KMZ, the session data (including polygon) loads correctly. However, selecting the polygon and clicking "Generate Path" does nothing.

## Steps to Reproduce
1.  Import a KMZ file with a polygon.
2.  Select the polygon on the map (or ensure it's loaded).
3.  Click "Generate Path".
4.  **Result**: No path is generated.
5.  **Expected**: The path generation logic should execute using the selected polygon.

## Initial Analysis
-   **Component**: `SidebarMain.jsx`
-   **Function**: `handleGenerate`
-   **Suspect**: The `currentPolygon` state might be stale or not correctly updated when the polygon is "selected" via map interaction vs. "loaded" via import.
-   **Context**: We recently changed how `currentPolygon` is synced (props vs events).

## Investigation Plan
1.  Check `handleGenerate` in `SidebarMain.jsx`.
2.  Check how `currentPolygon` is passed and updated in `App.jsx`.
3.  Verify if `onPolygonDrawn` in `MapContainer` is called correctly when selecting an existing polygon.