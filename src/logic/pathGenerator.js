import * as turf from '@turf/turf';

// ... (existing imports)

function generateOrbitPath(polygonFeature, settings) {
  const { altitude, speed, gimbalPitch, spacing, straightenLegs, waypointAction } = settings;

  // 1. Calculate Center and Radius
  const center = turf.centroid(polygonFeature);
  const centerCoords = center.geometry.coordinates;

  // Calculate average radius from center to all vertices
  const vertices = polygonFeature.geometry.coordinates[0];
  let totalDist = 0;
  vertices.forEach(v => {
    totalDist += turf.distance(center, turf.point(v), { units: 'meters' });
  });
  const radius = totalDist / vertices.length;

  // 2. Calculate Circumference and Number of Points
  const circumference = 2 * Math.PI * radius;
  const numPoints = Math.max(3, Math.round(circumference / spacing));

  const waypoints = [];

  // 3. Generate Points
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * 360;
    // Create point at distance 'radius' and bearing 'angle' from center
    const pt = turf.destination(center, radius / 1000, angle, { units: 'kilometers' });

    // Calculate heading: Point -> Center
    // Bearing from Point to Center is (angle + 180) % 360
    // But we want the drone to face center.
    const heading = turf.bearing(pt, center);

    waypoints.push({
      id: crypto.randomUUID(),
      lng: pt.geometry.coordinates[0],
      lat: pt.geometry.coordinates[1],
      altitude: Number(altitude),
      speed: Number(speed),
      gimbalPitch: Number(gimbalPitch),
      heading: heading,
      straightenLegs: straightenLegs,
      action: waypointAction
    });
  }

  // Close the loop? Usually orbit implies full circle, so maybe add first point at end?
  // User didn't explicitly ask, but standard orbits often loop. 
  // Let's add the first point to the end to complete the circle.
  if (waypoints.length > 0) {
    const first = waypoints[0];
    waypoints.push({ ...first, id: crypto.randomUUID() });
  }

  return waypoints;
}

export function generatePhotogrammetryPath(polygonFeature, settings) {
  if (settings.pathType === 'orbit') {
    return generateOrbitPath(polygonFeature, settings);
  }

  const { altitude, sideOverlap, frontOverlap, angle, gimbalPitch, autoDirection, generateEveryPoint, reversePath, speed, straightenLegs, waypointAction } = settings;
  // ... (rest of existing grid logic)
  // 1. Calculate Line Spacing in METERS
  // Use customFOV from settings (defaulting to 82.1 if missing)
  const hfov = settings.customFOV || 82.1;
  const FOV_CONSTANT = Math.tan((hfov / 2) * (Math.PI / 180));

  const imageWidth = (altitude * FOV_CONSTANT) * 2;
  const lineSpacingMeters = imageWidth * (1 - (sideOverlap / 100));

  // 2. Convert Spacing to DEGREES (Lat/Lng approximation)
  const lineSpacingDegrees = lineSpacingMeters / 111111;

  // 3. Define a fixed pivot point for rotation
  const pivot = turf.centroid(polygonFeature);

  // 4. Determine Rotation Angle
  let rotationAngle = angle;
  if (autoDirection) {
    // Find longest edge
    let maxLen = 0;
    let maxBearing = 0;
    const coords = polygonFeature.geometry.coordinates[0];
    for (let i = 0; i < coords.length - 1; i++) {
      const start = turf.point(coords[i]);
      const end = turf.point(coords[i + 1]);
      const dist = turf.distance(start, end);
      if (dist > maxLen) {
        maxLen = dist;
        maxBearing = turf.bearing(start, end);
      }
    }
    rotationAngle = maxBearing;
  }

  // Rotate Polygon
  const rotation = -rotationAngle;
  const rotatedPoly = turf.transformRotate(polygonFeature, rotation, { pivot: pivot });
  const bbox = turf.bbox(rotatedPoly);

  // Generate Grid Lines
  const flightLines = [];
  let currentY = bbox[1] + (lineSpacingDegrees / 2);

  // Ensure we cover the entire bounding box, including the top edge
  while (currentY <= bbox[3] + (lineSpacingDegrees / 10)) {
    const line = turf.lineString([
      [bbox[0] - 0.1, currentY],
      [bbox[2] + 0.1, currentY]
    ]);

    // Clip line to polygon
    const intersected = turf.lineSplit(line, rotatedPoly);

    const getLineCenter = (lineFeat) => {
      const coords = lineFeat.geometry.coordinates;
      if (Array.isArray(coords[0][0])) {
        return turf.midpoint(coords[0][0], coords[0][coords[0].length - 1]);
      }
      return turf.midpoint(coords[0], coords[coords.length - 1]);
    };

    if (intersected.features.length === 0) {
      const center = getLineCenter(line);
      if (turf.booleanPointInPolygon(center, rotatedPoly)) {
        flightLines.push(line.geometry.coordinates);
      }
    } else {
      intersected.features.forEach(seg => {
        const center = getLineCenter(seg);
        // Check if center is inside OR if it's a valid segment on the boundary
        if (turf.booleanPointInPolygon(center, rotatedPoly)) {
          flightLines.push(seg.geometry.coordinates);
        }
      });
    }

    currentY += lineSpacingDegrees;
  }

  // Connect Lines
  let waypoints = [];
  flightLines.forEach((lineCoords, index) => {
    let coords = (index % 2 === 1) ? lineCoords.reverse() : lineCoords;

    // Interpolate points if requested
    if (generateEveryPoint) {
      const start = turf.point(coords[0]);
      const end = turf.point(coords[1]);
      const dist = turf.distance(start, end, { units: 'meters' });

      // Calculate Front Spacing based on Overlap
      // Height_ground = (2 * Altitude * tan(HFOV / 2)) * (3 / 4)
      // Interval = Height_ground * (1 - (OverlapPercentage / 100))
      const groundHeight = imageWidth * (3 / 4);
      const frontSpacingMeters = groundHeight * (1 - (frontOverlap / 100));

      // Ensure we don't have infinite points if spacing is 0 (shouldn't happen with valid inputs)
      const safeSpacing = Math.max(1, frontSpacingMeters);

      const numPoints = Math.floor(dist / safeSpacing);

      if (numPoints >= 1) {
        const line = turf.lineString(coords);
        const newCoords = [];
        for (let i = 0; i <= numPoints; i++) {
          const pt = turf.along(line, (i * safeSpacing) / 1000, { units: 'kilometers' }); // turf.along uses km by default or takes units
          // Actually turf.along takes (line, distance, options). Distance unit defaults to km.
          // Let's be explicit.
          const ptMeters = turf.along(line, i * safeSpacing, { units: 'meters' });
          newCoords.push(ptMeters.geometry.coordinates);
        }
        // Ensure the last point is included if it's significantly far from the last interpolated point
        // Or just rely on the loop. The loop goes up to numPoints * spacing. 
        // If dist is 100 and spacing is 30: 0, 30, 60, 90. 
        // The end point is at 100. We might want to add it if it's not covered.
        // Standard photogrammetry usually wants consistent spacing. 
        // Let's stick to the calculated intervals.

        coords = newCoords;
      }
    }

    coords.forEach(c => {
      waypoints.push({
        id: crypto.randomUUID(),
        lng: c[0],
        lat: c[1],
        altitude: Number(altitude),
        speed: Number(speed),
        gimbalPitch: Number(gimbalPitch),
        heading: 0,
        straightenLegs: straightenLegs,
        action: waypointAction
      });
    });
  });

  // Rotate back
  if (waypoints.length === 0) return [];

  const flatPoints = turf.points(waypoints.map(p => [p.lng, p.lat]));
  const restoredPoints = turf.transformRotate(flatPoints, rotationAngle, { pivot: pivot });

  restoredPoints.features.forEach((pt, i) => {
    waypoints[i].lng = pt.geometry.coordinates[0];
    waypoints[i].lat = pt.geometry.coordinates[1];
  });

  // Reverse if requested
  if (reversePath) {
    waypoints.reverse();
  }

  // Calculate Headings (Point to next waypoint)
  for (let i = 0; i < waypoints.length; i++) {
    if (i < waypoints.length - 1) {
      const start = turf.point([waypoints[i].lng, waypoints[i].lat]);
      const end = turf.point([waypoints[i + 1].lng, waypoints[i + 1].lat]);
      waypoints[i].heading = turf.bearing(start, end);
    } else {
      // Last point inherits the heading of the segment leading up to it
      if (i > 0) waypoints[i].heading = waypoints[i - 1].heading;
    }
  }

  return waypoints;
}
