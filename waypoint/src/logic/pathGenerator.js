import * as turf from '@turf/turf';

export function generatePhotogrammetryPath(polygonFeature, altitude, overlap, angle, gimbalPitch) {
  // Mini 4 Pro FOV Constant (approx 82.1 deg horizontal)
  const FOV_CONSTANT = Math.tan(41.05 * (Math.PI / 180)); 
  
  // Calculate Line Spacing
  // Width of ground visible = (Alt * tan(half_fov)) * 2
  const imageWidth = (altitude * FOV_CONSTANT) * 2;
  const lineSpacing = imageWidth * (1 - (overlap / 100));

  // Rotate Polygon to flatten the requested angle
  const rotation = -angle; 
  const rotatedPoly = turf.transformRotate(polygonFeature, rotation);
  const bbox = turf.bbox(rotatedPoly); // [minX, minY, maxX, maxY]

  // Generate Grid Lines
  const flightLines = [];
  let currentY = bbox[1] + (lineSpacing / 2);

  while (currentY < bbox[3]) {
    const line = turf.lineString([
      [bbox[0] - 0.05, currentY], 
      [bbox[2] + 0.05, currentY]
    ]);
    
    // Clip line to polygon
    const intersected = turf.lineSplit(line, rotatedPoly);
    intersected.features.forEach(seg => {
      const center = turf.midpoint(seg);
      if (turf.booleanPointInPolygon(center, rotatedPoly)) {
        flightLines.push(seg.geometry.coordinates);
      }
    });
    currentY += lineSpacing;
  }

  // Connect Lines (Snake/ZigZag)
  const waypoints = [];
  flightLines.forEach((lineCoords, index) => {
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

  // Calculate Headings
  for (let i = 0; i < waypoints.length; i++) {
    if (i < waypoints.length - 1) {
      const start = turf.point([waypoints[i].lng, waypoints[i].lat]);
      const end = turf.point([waypoints[i+1].lng, waypoints[i+1].lat]);
      waypoints[i].heading = turf.bearing(start, end);
    } else {
      waypoints[i].heading = waypoints[i-1].heading; 
    }
  }

  return waypoints;
}