📋 TRIAGE.md
Issue: wpml:waypointSpeed Hardcoded in Export
Severity: High (Data Integrity)
Component: src/utils/djiExporter.js
Root Cause Analysis:
The downloadKMZ function (or its internal template generator) likely contains a static XML tag <wpml:waypointSpeed>10</wpml:waypointSpeed> inside the waypoint loop.
It fails to inject the waypoint.speed value from the waypoints array passed from the store.
Impact:
Flight missions execute at 10m/s regardless of user settings.
Disregards "Safe Speed" calculations for motion blur/shutter interval, potentially leading to blurry or missing photos.
Proposed Fix:
Locate the XML generation loop in djiExporter.js.
Replace the literal 10 with the dynamic ${waypoint.speed} value.
Ensure fallback logic exists (e.g., waypoint.speed || settings.speed) if a waypoint lacks a specific speed override.