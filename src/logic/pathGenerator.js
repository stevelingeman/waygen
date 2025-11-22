import * as turf from '@turf/turf';

export function generatePhotogrammetryPath(polygonFeature, settings) {
  const { altitude, overlap, angle, gimbalPitch, autoDirection, generateEveryPoint, reversePath, speed } = settings;

  // Mini 4 Pro FOV Constant (approx 82.1 deg horizontal)
  const FOV_CONSTANT = Math.tan(41.05 * (Math.PI / 180));

  // 1. Calculate Line Spacing in METERS
  const imageWidth = (altitude * FOV_CONSTANT) * 2;
  const lineSpacingMeters = imageWidth * (1 - (overlap / 100));

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

  while (currentY < bbox[3]) {
    const line = turf.lineString([
      [bbox[0] - 0.05, currentY],
      [bbox[2] + 0.05, currentY]
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
      const numPoints = Math.floor(dist / 10); // Point every 10m
      if (numPoints > 1) {
        const line = turf.lineString(coords);
        const newCoords = [];
        for (let i = 0; i <= numPoints; i++) {
          const pt = turf.along(line, (i / numPoints) * turf.length(line, { units: 'meters' }), { units: 'meters' });
          newCoords.push(pt.geometry.coordinates);
        }
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
        heading: 0
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
