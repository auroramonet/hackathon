
// -------------------------------
// CONFIG / PARAMETERS
// -------------------------------
const BBOX = {
  south: -4.33,
  west: 15.29,
  north: -4.31,
  east: 15.31
};

const OVERPASS_URL = "http://overpass-api.de/api/interpreter";

// -------------------------------
// BUILD QUERY
// -------------------------------
function buildOverpassQuery(bbox) {
  return `
  [out:json][timeout:50];
  (
    way["building"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    way["amenity"="school"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    way["amenity"="hospital"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    way["amenity"="fire_station"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    way["amenity"="police"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    way["amenity"="government"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    way["man_made"="tower"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    way["building"="public"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    way["landuse"="industrial"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    way["bridge"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    way["highway"="primary"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  );
  out body;
  >;
  out skel qt;
  `;
}

// -------------------------------
// FETCH DATA
// -------------------------------
async function fetchOSMData(query) {
  const response = await fetch(OVERPASS_URL, { method: "POST", body: query });
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
  return await response.json();
}

// -------------------------------
// CONVERT TO FEATURE LIST FOR GEMINI
// -------------------------------
function osmToFeatureList(osmJson) {
  const nodes = {};
  osmJson.elements.forEach(el => {
    if (el.type === "node") nodes[el.id] = { lon: el.lon, lat: el.lat };
  });

  const featureList = [];

  osmJson.elements.forEach(el => {
    if (el.type === "way") {
      const coords = el.nodes.map(id => nodes[id]).filter(Boolean);
      if (coords.length < 2) return;

      // Compute approximate centroid for this building/way
      const lats = coords.map(c => c[1]);
      const lons = coords.map(c => c[0]);
      const centroid = {
        lat: lats.reduce((a, b) => a + b, 0) / lats.length,
        lon: lons.reduce((a, b) => a + b, 0) / lons.length
      };

      // Extract basic tags
      const tags = el.tags || {};
      const buildingType = tags.building || tags.amenity || "unknown";

      // Placeholder earthquake-relevant fields
      const feature = {
        id: el.id,
        type: buildingType,
        lat: centroid.lat,
        lon: centroid.lon,
        height_m: tags.height ? parseFloat(tags.height) : null,
        ground_type: null,              // Fill in from geological data
        distance_to_fault_km: null,     // Fill in from fault line data
        population_density: null,       // Fill in from population dataset
        critical: ["school","hospital","fire_station","police","government"].includes(buildingType)
      };

      featureList.push(feature);
    }
  });

  return featureList;
}

// -------------------------------
// MAIN
// -------------------------------
async function main() {
  try {
    const query = buildOverpassQuery(BBOX);
    const osmJson = await fetchOSMData(query);
    console.log(`Retrieved ${osmJson.elements.length} elements from OSM.`);

    const features = osmToFeatureList(osmJson);
    
    // Now features can be stored or sent to Gemini
    console.log(`Prepared ${features.length} earthquake-relevant features.`);
    // Example: store to JSON file or database
    // fs.writeFileSync("earthquake_features.json", JSON.stringify(features, null, 2));

    return features;
  } catch (err) {
    console.error("Error:", err.message);
    return [];
  }
}

// Run main if executed directly
if (require.main === module) {
  main();
}

module.exports = { main, osmToFeatureList };
