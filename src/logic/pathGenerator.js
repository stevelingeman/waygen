import * as turf from '@turf/turf';

export function generatePhotogrammetryPath(polygonFeature, altitude, overlap, angle, gimbalPitch) {
  // Mini 4 Pro FOV Constant (approx 82.1 deg horizontal)
  const FOV_CONSTANT = Math.tan(41.05 * (Math.PI / 180)); 
  
  // 1. Calculate Line Spacing in METERS
  const imageWidth = (altitude * FOV_CONSTANT) * 2;
  const lineSpacingMeters = imageWidth * (1 - (overlap / 100));

  // 2. Convert Spacing to DEGREES (Lat/Lng approximation)
  const lineSpacingDegrees = lineSpacingMeters / 111111;

  // Rotate Polygon to flatten the requested angle
  const rotation = -angle; 
  const rotatedPoly = turf.transformRotate(polygonFeature, rotation);
  const bbox = turf.bbox(rotatedPoly); 

  // Generate Grid Lines
  const flightLines = [];
  
  // Start slightly inside the box
  let currentY = bbox[1] + (lineSpacingDegrees / 2);

  while (currentY < bbox[3]) {
    // Draw a line across the entire world width of the bbox
    const line = turf.lineString([
      [bbox[0] - 0.05, currentY], 
      [bbox[2] + 0.05, currentY]
    ]);
    
    // Clip line to polygon
    const intersected = turf.lineSplit(line, rotatedPoly);
    
    // Helper to get midpoint of a line segment
    const getLineCenter = (lineFeat) => {
      const coords = lineFeat.geometry.coordinates;
      return turf.midpoint(coords[0], coords[coords.length - 1]);
    };

    if (intersected.features.length === 0) {
       // Check if the line itself is inside (fully contained)
       const center = getLineCenter(line);
       if (turf.booleanPointInPolygon(center, rotatedPoly)) {
           flightLines.push(line.geometry.coordinates);
       }
    } else {
        intersected.features.forEach(seg => {
          const center = getLineCenter(seg); // <--- Fixed this line
          if (turf.booleanPointInPolygon(center, rotatedPoly)) {
            flightLines.push(seg.geometry.coordinates);
          }
        });
    }

    currentY += lineSpacingDegrees;
  }

  // Connect Lines (Snake/ZigZag)
  const waypoints = [];
  flightLines.forEach((lineCoords, index) => {
    // Flip every second line
    const coords = (index % 2 === 1) ? lineCoords.reverse() : lineCoords;
    
    coords.forEach(c => {
      waypoints.push({
        id: crypto.randomUUID(), 
        lng: c[0],
        lat: c[1],
        altitude: Number(altitude),
        speed: 3.5, 
        gimbalPitch: Number(gimbalPitch),
        heading: 0 
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
      if(i > 0) waypoints[i].heading = waypoints[i-1].heading; 
    }
  }

  return waypoints;
}
