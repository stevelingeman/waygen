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
