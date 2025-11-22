import { kml } from '@tmcw/togeojson';
import JSZip from 'jszip';

export const parseImport = async (file) => {
  // 1. Handle raw KML files (text)
  if (file.name.toLowerCase().endsWith('.kml')) {
    const text = await file.text();
    const dom = new DOMParser().parseFromString(text, 'text/xml');
    return kml(dom);
  }

  // 2. Handle KMZ files (zip)
  if (file.name.toLowerCase().endsWith('.kmz')) {
    try {
      const zip = await JSZip.loadAsync(file);

      // CRITICAL FIX: Look for DJI "waylines.wpml" FIRST.
      // DJI puts metadata in 'template.kml' (empty) and points in 'waylines.wpml'.
      let targetFile = Object.keys(zip.files).find(n => n.toLowerCase().endsWith('waylines.wpml'));

      // Fallback: If not a DJI drone file, look for standard doc.kml
      if (!targetFile) {
        targetFile = Object.keys(zip.files).find(n => n.toLowerCase().endsWith('.kml'));
      }

      if (targetFile) {
        const xmlText = await zip.file(targetFile).async('text');
        const xmlDom = new DOMParser().parseFromString(xmlText, 'text/xml');

        // Convert XML to GeoJSON
        const geoJSON = kml(xmlDom);

        // ENRICHMENT: Manually extract WPML data that togeojson misses
        const placemarks = Array.from(xmlDom.getElementsByTagName("Placemark"));

        geoJSON.features.forEach(feature => {
          if (feature.geometry.type === 'Point') {
            // Find matching Placemark by coordinates (fuzzy match)
            const [fLng, fLat] = feature.geometry.coordinates;

            const match = placemarks.find(pm => {
              const point = pm.getElementsByTagName("Point")[0];
              if (!point) return false;
              const coords = point.getElementsByTagName("coordinates")[0]?.textContent.trim();
              if (!coords) return false;
              const [pLng, pLat] = coords.split(',').map(Number);
              return Math.abs(pLng - fLng) < 0.000001 && Math.abs(pLat - fLat) < 0.000001;
            });

            if (match) {
              const heading = match.getElementsByTagName("wpml:waypointHeading")[0]?.textContent;
              const speed = match.getElementsByTagName("wpml:waypointSpeed")[0]?.textContent;
              const height = match.getElementsByTagName("wpml:ellipsoidHeight")[0]?.textContent || match.getElementsByTagName("wpml:height")[0]?.textContent;
              const gimbal = match.getElementsByTagName("wpml:gimbalPitchAngle")[0]?.textContent;

              if (heading) feature.properties.heading = Number(heading);
              if (speed) feature.properties.speed = Number(speed);
              if (height) feature.properties.altitude = Number(height);
              if (gimbal) feature.properties.gimbalPitch = Number(gimbal);
            }
          }
        });

        return geoJSON;
      } else {
        throw new Error("No valid KML or WPML file found inside KMZ.");
      }
    } catch (e) {
      console.error("KMZ Parse Error:", e);
      throw new Error("Failed to unzip or parse KMZ.");
    }
  }

  throw new Error("Unsupported file format. Please use .kml or .kmz");
};
