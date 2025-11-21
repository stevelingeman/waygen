import { kml } from '@tmcw/togeojson';
import JSZip from 'jszip';

export const parseImport = async (file) => {
  const text = await file.text();
  const dom = new DOMParser().parseFromString(text, 'text/xml');
  
  // 1. Try parsing as standard KML
  if (file.name.endsWith('.kml')) {
    return kml(dom);
  }

  // 2. Try parsing KMZ (Zip)
  if (file.name.endsWith('.kmz')) {
    const zip = await JSZip.loadAsync(file);
    // Look for template.kml or wpmz/template.kml
    const kmlFile = Object.keys(zip.files).find(n => n.endsWith('.kml'));
    if (kmlFile) {
      const xmlText = await zip.file(kmlFile).async('text');
      const xmlDom = new DOMParser().parseFromString(xmlText, 'text/xml');
      return kml(xmlDom);
    }
  }
  
  throw new Error("Invalid file format");
};