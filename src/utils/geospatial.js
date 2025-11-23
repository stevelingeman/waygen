import * as turf from '@turf/turf';

/**
 * Calculates the camera footprint on the ground.
 * @param {Object} center - { lng, lat }
 * @param {number} altitude - Altitude in meters
 * @param {number} heading - Drone heading in degrees (0 = North)
 * @param {number} hfov - Horizontal Field of View in degrees
 * @returns {Object} GeoJSON Polygon feature
 */
export const calculateFootprint = (center, altitude, heading, hfov) => {
    if (!center || !altitude || !hfov) return null;

    // 1. Calculate Dimensions
    // Width = 2 * h * tan(HFOV / 2)
    const width = 2 * altitude * Math.tan((hfov * Math.PI) / 360);
    const height = width * (3 / 4); // 4:3 Aspect Ratio

    // 2. Calculate Corners (relative to center, before rotation)
    // We need to find the distance to the corners to use turf.destination
    // Actually, it's easier to calculate the 4 corners as offsets in meters and then map them to coordinates.
    // But turf.destination takes bearing and distance.

    // Let's calculate the half-width and half-height
    const hw = width / 2;
    const hh = height / 2;

    // Distance from center to corner
    const diagDist = Math.sqrt(hw * hw + hh * hh);

    // Bearings to corners (relative to North 0, clockwise)
    // Top-Right (NE): atan(w/h) -> but wait, heading is 0.
    // Let's assume the drone is pointing North (0).
    // Top-Right is at angle atan(hw/hh).
    const angleTR = (Math.atan2(hw, hh) * 180) / Math.PI;
    const angleBR = 180 - angleTR;
    const angleBL = 180 + angleTR;
    const angleTL = 360 - angleTR;

    // 3. Generate the 4 corners using turf.destination
    // We add the drone's heading to the corner angles.
    const centerPt = turf.point([center.lng, center.lat]);

    const p1 = turf.destination(centerPt, diagDist / 1000, heading + angleTR, { units: 'kilometers' });
    const p2 = turf.destination(centerPt, diagDist / 1000, heading + angleBR, { units: 'kilometers' });
    const p3 = turf.destination(centerPt, diagDist / 1000, heading + angleBL, { units: 'kilometers' });
    const p4 = turf.destination(centerPt, diagDist / 1000, heading + angleTL, { units: 'kilometers' });

    // 4. Create Polygon
    const coordinates = [
        [
            p1.geometry.coordinates,
            p2.geometry.coordinates,
            p3.geometry.coordinates,
            p4.geometry.coordinates,
            p1.geometry.coordinates // Close the loop
        ]
    ];

    return turf.polygon(coordinates, {
        altitude,
        heading,
        hfov
    });
};
