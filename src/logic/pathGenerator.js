import * as turf from '@turf/turf';

export function generatePhotogrammetryPath(polygonFeature, altitude, overlap, angle, gimbalPitch) {
  // Mini 4 Pro FOV Constant (approx 82.1 deg horizontal)
  const FOV_CONSTANT = Math.tan(41.05 * (Math.PI / 180)); 
  
  // 1. Calculate Line Spacing in METERS
  // Width of ground visible = (Alt * tan(half_fov)) * 2
  const imageWidth = (altitude * FOV_CONSTANT) * 2;
  const lineSpacingMeters = imageWidth * (1 - (overlap / 100));

  // 2. Convert Spacing to DEGREES (Lat/Lng approximation)
  // 1 degree of latitude is approximately 111,111 meters.
  // This approximation is sufficient for small drone missions.
  const lineSpacingDegrees = lineSpacingMeters / 111111;

  // Rotate Polygon to flatten the requested angle
  const rotation = -angle; 
  const rotatedPoly = turf.transformRotate(polygonFeature, rotation);
  const bbox = turf.bbox(rotatedPoly); // [minX, minY, maxX, maxY]

  // Generate Grid Lines
  const flightLines = [];
  
  // Start slightly inside the box to ensure coverage
  let currentY = bbox[1] + (lineSpacingDegrees / 2);

  // Loop until we hit the top of the bounding box
  while (currentY < bbox[3]) {
    // Draw a line across the entire world width of the bbox
    // We add a buffer (0.05 deg) to ensure it fully crosses the polygon
    const line = turf.lineString([
      [bbox[0] - 0.05, currentY], 
      [bbox[2] + 0.05, currentY]
    ]);
    
    // Clip line to polygon
    // turf.lineSplit cuts the line at the polygon edges.
    // We then check which segment is actually INSIDE.
    const intersected = turf.lineSplit(line, rotatedPoly);
    
    // If the line is fully inside (no split), lineSplit returns empty. 
    // We handle that by checking intersection or point-in-poly directly.
    if (intersected.features.length === 0) {
       // Fallback: Check if the line itself is inside (rare for bbox method but possible)
       const center = turf.midpoint(line);
       if (turf.booleanPointInPolygon(center, rotatedPoly)) {
           flightLines.push(line.geometry.coordinates);
       }
    } else {
        intersected.features.forEach(seg => {
          const center = turf.midpoint(seg);
          if (turf.booleanPointInPolygon(center, rotatedPoly)) {
            flightLines.push(seg.geometry.coordinates);
          }
        });
    }

    // Increment by DEGREES, not meters
    currentY += lineSpacingDegrees;
  }

  // Connect Lines (Snake/ZigZag)
  const waypoints = [];
  flightLines.forEach((lineCoords, index) => {
    // Flip every second line to create a continuous path
    const coords = (index % 2 === 1) ? lineCoords.reverse() : lineCoords;
    
    coords.forEach(c => {
      waypoints.push({
        id: crypto.randomUUID(), // Unique ID for React keys/selection
        lng: c[0],
        lat: c[1],
        altitude: Number(altitude),
        speed: 3.5, 
        gimbalPitch: Number(gimbalPitch),
        heading: 0 // Calculated below
      });
    });
  });

  // Rotate back to original orientation
  if (waypoints.length === 0) return [];
  
  const flatPoints = turf.points(waypoints.map(p => [p.lng, p.lat]));
  const restoredPoints = turf.transformRotate(flatPoints, angle);
  
  restoredPoints.features.forEach((pt, i) => {
    waypoints[i].lng = pt.geometry.coordinates[0];
    waypoints[i].lat = pt.geometry.coordinates[1];
  });

  // Calculate Headings (Point to next waypoint)
  for (let i = 0; i < waypoints.length; i++) {
    if (i < waypoints.length - 1) {
      const start = turf.point([waypoints[i].lng, waypoints[i].lat]);
      const end = turf.point([waypoints[i+1].lng, waypoints[i+1].lat]);
      waypoints[i].heading = turf.bearing(start, end);
    } else {
      // Last point keeps previous heading
      if(i > 0) waypoints[i].heading = waypoints[i-1].heading; 
    }
  }

  return waypoints;
}
