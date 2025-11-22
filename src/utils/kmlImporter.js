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

        // Helper to get tag value, trying both with and without "wpml:" prefix
        const getTagValue = (element, tagName) => {
          let tag = element.getElementsByTagName("wpml:" + tagName)[0];
          if (!tag) tag = element.getElementsByTagName(tagName)[0];
          return tag ? tag.textContent : null;
        };

        // Strategy: Try to match by Index first (most robust for generated files), then by Coordinates
        const useIndexMatching = geoJSON.features.length === placemarks.length;

        geoJSON.features.forEach((feature, index) => {
          if (feature.geometry.type === 'Point') {
            let match = null;

            if (useIndexMatching) {
              match = placemarks[index];
            } else {
              // Fallback: Find matching Placemark by coordinates (fuzzy match)
              const [fLng, fLat] = feature.geometry.coordinates;
              match = placemarks.find(pm => {
                const point = pm.getElementsByTagName("Point")[0];
                if (!point) return false;
                const coordsText = point.getElementsByTagName("coordinates")[0]?.textContent || "";
                const coords = coordsText.trim().split(',');
                if (coords.length < 2) return false;

                const pLng = Number(coords[0]);
                const pLat = Number(coords[1]);

                // Use a slightly larger epsilon for float comparison
                return Math.abs(pLng - fLng) < 0.0001 && Math.abs(pLat - fLat) < 0.0001;
              });
            }

            if (match) {
              const heading = getTagValue(match, "waypointHeading");
              const speed = getTagValue(match, "waypointSpeed");
              const ellipsoidHeight = getTagValue(match, "ellipsoidHeight");
              const height = getTagValue(match, "height");
              const gimbal = getTagValue(match, "gimbalPitchAngle");

              if (heading !== null) feature.properties.heading = Number(heading);
              if (speed !== null) feature.properties.speed = Number(speed);
              if (ellipsoidHeight !== null) feature.properties.altitude = Number(ellipsoidHeight);
              else if (height !== null) feature.properties.altitude = Number(height);
              if (gimbal !== null) feature.properties.gimbalPitch = Number(gimbal);
            }
          }
        });

        // Valid KMLs might return empty features if parsing failed
        if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
          throw new Error("No features found in KML/WPML file.");
        }

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
