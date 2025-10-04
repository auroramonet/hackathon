/* eslint-disable no-undef */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Helper function to calculate approximate area in square kilometers
function calculateArea(coordinates) {
  if (coordinates.length < 4) return 0;

  // Simple approximation using shoelace formula
  let area = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [x1, y1] = coordinates[i];
    const [x2, y2] = coordinates[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  area = Math.abs(area / 2);

  // Convert to approximate square kilometers (rough estimate)
  // 1 degree ≈ 111 km at equator
  const areaInKm2 = area * 111 * 111;
  return areaInKm2.toFixed(2);
}

// Helper function to classify severity
function getSeverityLevel(magnitude) {
  if (magnitude < 3)
    return { level: "LOW", color: "green", description: "Minor incident" };
  if (magnitude < 5)
    return {
      level: "MODERATE",
      color: "yellow",
      description: "Notable concern",
    };
  if (magnitude < 7)
    return { level: "HIGH", color: "orange", description: "Serious threat" };
  if (magnitude < 9)
    return { level: "SEVERE", color: "red", description: "Major catastrophe" };
  return {
    level: "CRITICAL",
    color: "darkred",
    description: "Extreme disaster",
  };
}

// Helper function to calculate bounding box from coordinates
function calculateBoundingBox(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }
  
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  
  coordinates.forEach(coord => {
    const [lon, lat] = coord;
    
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  });
  
  return {
    south: minLat,
    west: minLon, 
    north: maxLat,
    east: maxLon
  };
}

// Get population data using US Census API (much more accurate for small areas)
async function getPopulationData(south, west, north, east) {
  try {
    // Calculate center point of the bounding box
    const centerLat = (south + north) / 2;
    const centerLon = (west + east) / 2;
    
    console.log(`🔍 Getting census data for center point: ${centerLat.toFixed(6)}, ${centerLon.toFixed(6)}`);
    
    // Step 1: Get census geography information for the center point
    const geoResponse = await fetch(
      `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${centerLon}&y=${centerLat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`
    );
    
    if (!geoResponse.ok) {
      throw new Error(`Census geocoding failed: ${geoResponse.status}`);
    }
    
    const geoData = await geoResponse.json();
    
    if (!geoData.result || !geoData.result.geographies) {
      throw new Error('No census geography found for coordinates');
    }
    
    // Extract census tract information
    const censusTracts = geoData.result.geographies['Census Tracts'];
    const censusBlocks = geoData.result.geographies['2020 Census Blocks'];
    
    if (!censusTracts || censusTracts.length === 0) {
      throw new Error('No census tract found for coordinates');
    }
    
    const tract = censusTracts[0];
    const state = tract.GEOID.substring(0, 2);
    const county = tract.GEOID.substring(2, 5);
    const tractCode = tract.GEOID.substring(5);
    
    console.log(`📊 Found Census Tract: ${tract.NAME} (${tract.GEOID})`);
    
    // Step 2: Get population data for the census tract
    const popResponse = await fetch(
      `https://api.census.gov/data/2020/dec/pl?get=P1_001N&for=tract:${tractCode}&in=state:${state}%20county:${county}`
    );
    
    if (!popResponse.ok) {
      throw new Error(`Census population API failed: ${popResponse.status}`);
    }
    
    const popData = await popResponse.json();
    
    if (!popData || popData.length < 2) {
      throw new Error('No population data found');
    }
    
    const population = parseInt(popData[1][0]);
    
    // Calculate area of the bounding box in km²
    const earthRadius = 6371;
    const latDiff = Math.abs(north - south) * Math.PI / 180;
    const lonDiff = Math.abs(east - west) * Math.PI / 180;
    const avgLat = (south + north) / 2 * Math.PI / 180;
    const bboxArea = earthRadius * earthRadius * latDiff * lonDiff * Math.cos(avgLat);
    
    // Calculate tract area in km² (approximate)
    const tractAreaLand = parseInt(tract.AREALAND) / 1000000; // Convert from m² to km²
    
    // Estimate population in the bounding box based on area ratio
    const areaRatio = Math.min(bboxArea / tractAreaLand, 1.0); // Cap at 1.0
    const estimatedPopulation = Math.round(population * areaRatio);
    
    console.log(`👥 Census Tract Population: ${population.toLocaleString()}`);
    console.log(`📏 Tract Area: ${tractAreaLand.toFixed(2)} km²`);
    console.log(`📐 Bounding Box Area: ${bboxArea.toFixed(2)} km²`);
    console.log(`📊 Area Ratio: ${(areaRatio * 100).toFixed(1)}%`);
    console.log(`🎯 Estimated Population in Area: ${estimatedPopulation.toLocaleString()}`);
    
    return {
      total_population: estimatedPopulation,
      places: [{
        name: tract.NAME,
        population: population,
        estimated_in_area: estimatedPopulation,
        lat: parseFloat(tract.CENTLAT),
        lon: parseFloat(tract.CENTLON),
        geoid: tract.GEOID
      }],
      places_count: 1,
      census_data: {
        tract_name: tract.NAME,
        tract_geoid: tract.GEOID,
        tract_population: population,
        tract_area_km2: tractAreaLand,
        bbox_area_km2: bboxArea,
        area_ratio: areaRatio,
        estimation_method: 'census_tract_area_weighted'
      }
    };
    
  } catch (error) {
    console.error('Error fetching census population data:', error);
    
    // Fallback to simple density estimation
    const area = Math.abs((north - south) * (east - west)) * 111 * 111; // Rough km²
    const estimatedDensity = 10000; // people per km² (urban average)
    const fallbackPopulation = Math.round(area * estimatedDensity);
    
    return {
      total_population: fallbackPopulation,
      places: [{
        name: 'Estimated Area',
        population: fallbackPopulation,
        estimated_in_area: fallbackPopulation,
        lat: (south + north) / 2,
        lon: (west + east) / 2
      }],
      places_count: 1,
      error: error.message,
      estimation_method: 'fallback_density'
    };
  }
}

// Get building data from Overpass API
async function getBuildingData(south, west, north, east) {
  // Query for buildings
  const buildingsQuery = `[out:json][timeout:30];
    (way["building"]["building"!="yes"](${south},${west},${north},${east});
     node["building"]["building"!="yes"](${south},${west},${north},${east}););
    out tags;`;
  
  // Query for essential services
  const servicesQuery = `[out:json][timeout:30];
    (node["amenity"~"hospital|school|university|clinic|pharmacy|fire_station|police|bank|restaurant|cafe"](${south},${west},${north},${east});
     way["amenity"~"hospital|school|university|clinic|pharmacy|fire_station|police|bank|restaurant|cafe"](${south},${west},${north},${east}););
    out tags;`;
  
  try {
    // Get buildings and services in parallel
    const [buildingResponse, servicesResponse] = await Promise.all([
      fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: buildingsQuery
      }),
      fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST', 
        body: servicesQuery
      })
    ]);
    
    const buildingData = await buildingResponse.json();
    const servicesData = await servicesResponse.json();
    
    // Count building types
    const buildingCounts = {};
    buildingData.elements.forEach(el => {
      const type = el.tags.building;
      if (type && type !== 'yes') {
        buildingCounts[type] = (buildingCounts[type] || 0) + 1;
      }
    });
    
    // Count service types
    const serviceCounts = {};
    servicesData.elements.forEach(el => {
      const type = el.tags.amenity;
      if (type) {
        serviceCounts[type] = (serviceCounts[type] || 0) + 1;
      }
    });
    
    // Calculate summary
    const residential = (buildingCounts.apartments || 0) + 
                       (buildingCounts.residential || 0) + 
                       (buildingCounts.house || 0);
    
    const commercial = (buildingCounts.commercial || 0) + 
                      (buildingCounts.retail || 0) + 
                      (buildingCounts.office || 0);
    
    const critical_facilities = {
      hospitals: serviceCounts.hospital || 0,
      schools: serviceCounts.school || 0,
      fire_stations: serviceCounts.fire_station || 0,
      police_stations: serviceCounts.police || 0,
      clinics: serviceCounts.clinic || 0,
      pharmacies: serviceCounts.pharmacy || 0
    };
    
    return {
      total_buildings: buildingData.elements.length,
      building_types: buildingCounts,
      service_types: serviceCounts,
      summary: {
        residential_buildings: residential,
        commercial_buildings: commercial,
        critical_facilities: critical_facilities,
        total_critical: Object.values(critical_facilities).reduce((a, b) => a + b, 0)
      }
    };
    
  } catch (error) {
    console.error('Error fetching building data:', error);
    return {
      total_buildings: 0,
      building_types: {},
      service_types: {},
      summary: {
        residential_buildings: 0,
        commercial_buildings: 0,
        critical_facilities: {},
        total_critical: 0
      },
      error: error.message
    };
  }
}

// Analyze catastrophe area endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { coordinates, magnitude, center, placeName, boundingBox } = req.body;

    if (!coordinates || !magnitude) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("🔍 Starting catastrophe analysis...");

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Calculate additional metrics
    const areaSize = calculateArea(coordinates);
    const severity = getSeverityLevel(magnitude);

    // Get bounding box for API calls
    const bbox = boundingBox || calculateBoundingBox(coordinates);
    
    if (!bbox) {
      return res.status(400).json({ error: "Could not calculate bounding box from coordinates" });
    }

    console.log(`📍 Bounding box: ${bbox.south.toFixed(4)}, ${bbox.west.toFixed(4)}, ${bbox.north.toFixed(4)}, ${bbox.east.toFixed(4)}`);

    // Get real population and building data in parallel
    console.log("📊 Fetching real-world data...");
    const [populationData, buildingData] = await Promise.all([
      getPopulationData(bbox.south, bbox.west, bbox.north, bbox.east),
      getBuildingData(bbox.south, bbox.west, bbox.north, bbox.east)
    ]);

    console.log(`👥 Population found: ${populationData.total_population.toLocaleString()}`);
    console.log(`🏠 Buildings found: ${buildingData.total_buildings.toLocaleString()}`);
    console.log(`🏥 Critical facilities: ${buildingData.summary.total_critical}`);

    // Calculate estimated affected people
    const estimatedAffectedPeople = Math.max(
      populationData.total_population,
      buildingData.summary.residential_buildings * 2.5 // Avg 2.5 people per residential unit
    );

    // Prepare detailed data for AI
    const realWorldData = {
      population: populationData,
      buildings: buildingData,
      area_km2: areaSize,
      estimated_affected_people: Math.round(estimatedAffectedPeople),
      population_density: areaSize > 0 ? Math.round(populationData.total_population / areaSize) : 0
    };

    const prompt = `You are an emergency response analyst. Provide a rapid incident assessment in EXACTLY 250-300 words using REAL DATA.

INCIDENT DATA:
Location: ${placeName || "Unspecified location"}
Coordinates: ${
      center
        ? `${center[1].toFixed(4)}°N, ${center[0].toFixed(4)}°E`
        : "Not provided"
    }
Area: ${areaSize} km²
Magnitude: ${magnitude.toFixed(1)}/10 (${severity.level})

REAL POPULATION DATA:
Total Population: ${realWorldData.population.total_population.toLocaleString()} people
Population Density: ${realWorldData.population_density.toLocaleString()} people/km²
Major Places: ${realWorldData.population.places.slice(0, 3).map(p => `${p.name} (${p.population.toLocaleString()})`).join(', ')}
Estimated Affected People: ${realWorldData.estimated_affected_people.toLocaleString()}

REAL BUILDING DATA:
Total Buildings: ${realWorldData.buildings.total_buildings.toLocaleString()}
Residential Buildings: ${realWorldData.buildings.summary.residential_buildings.toLocaleString()}
Commercial Buildings: ${realWorldData.buildings.summary.commercial_buildings.toLocaleString()}

CRITICAL INFRASTRUCTURE:
Hospitals: ${realWorldData.buildings.summary.critical_facilities.hospitals}
Schools: ${realWorldData.buildings.summary.critical_facilities.schools}
Fire Stations: ${realWorldData.buildings.summary.critical_facilities.fire_stations}
Police Stations: ${realWorldData.buildings.summary.critical_facilities.police_stations}
Clinics: ${realWorldData.buildings.summary.critical_facilities.clinics}
Pharmacies: ${realWorldData.buildings.summary.critical_facilities.pharmacies}
Total Critical Facilities: ${realWorldData.buildings.summary.total_critical}

FORMAT REQUIREMENTS:
- PLAIN TEXT ONLY - absolutely NO asterisks, NO markdown, NO special formatting
- Use specific percentages and numbers, not vague terms
- Combine related items into single lines
- Maximum 250-300 words total
- Short, scannable sentences

ANALYSIS STRUCTURE (USE THE REAL DATA ABOVE):

SEVERITY ASSESSMENT
Threat Level: ${severity.level}
Estimated Casualties: [Base on ${realWorldData.estimated_affected_people.toLocaleString()} affected people and magnitude ${magnitude.toFixed(1)}]
Time Window: [State hours/days for critical response]
Infrastructure Damage: [Consider ${realWorldData.buildings.total_buildings.toLocaleString()} total buildings]
Economic Impact: [Base on population and building density]

AFFECTED POPULATION
Total Impact: ${realWorldData.estimated_affected_people.toLocaleString()} people directly affected
Priority Groups: [Focus on residential areas with ${realWorldData.buildings.summary.residential_buildings.toLocaleString()} residential buildings]
Shelter Required: [Calculate from residential buildings and population]
Immediate Hazards: [Consider building collapse, infrastructure failure]

PRIORITY RESPONSE (48 Hours)
1. [Prioritize based on ${realWorldData.buildings.summary.total_critical} critical facilities]
2. [Focus on ${realWorldData.buildings.summary.critical_facilities.hospitals} hospitals, ${realWorldData.buildings.summary.critical_facilities.schools} schools]
3. [Coordinate with ${realWorldData.buildings.summary.critical_facilities.fire_stations} fire stations, ${realWorldData.buildings.summary.critical_facilities.police_stations} police stations]

RESOURCE DEPLOYMENT
Teams Required: [Scale to ${realWorldData.estimated_affected_people.toLocaleString()} affected people]
Critical Supplies: [Based on population density ${realWorldData.population_density.toLocaleString()} people/km²]
Coordination: [Use existing ${realWorldData.buildings.summary.critical_facilities.fire_stations + realWorldData.buildings.summary.critical_facilities.police_stations} emergency facilities]

TIMELINE
Recovery Estimate: [Based on infrastructure density and damage scale]

CRITICAL NOTES:
- Be hyper-specific with numbers
- No lists longer than 3 items
- Combine utilities/infrastructure into percentages
- One hazard type per mention only
- Ruthlessly eliminate repetition`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      analysis: text,
      realWorldData: realWorldData,
      metadata: {
        magnitude,
        severity: severity.level,
        severityDescription: severity.description,
        coordinates: coordinates.length - 1,
        location: placeName || "Unknown",
        areaSize: `${areaSize} km²`,
        estimatedImpact: severity.level,
        boundingBox: bbox,
        dataFetchTime: new Date().toISOString()
      },
    });
  } catch (error) {
    console.error("Error generating AI analysis:", error);
    res.status(500).json({
      error: "Failed to generate analysis",
      message: error.message,
    });
  }
});

// Get disaster recommendations endpoint
app.post("/api/recommendations", async (req, res) => {
  try {
    const { disasterType, magnitude, location } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `As a disaster management expert, provide specific recommendations for:
- Disaster type: ${disasterType || "General catastrophe"}
- Magnitude: ${magnitude}/10
- Location: ${location || "Unspecified"}

Provide 5 actionable recommendations focusing on:
1. Immediate safety measures
2. Resource allocation priorities
3. Communication strategies
4. Evacuation considerations
5. Recovery planning

Format as a numbered list. Keep it practical and concise.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      recommendations: text,
    });
  } catch (error) {
    console.error("Error generating recommendations:", error);
    res.status(500).json({
      error: "Failed to generate recommendations",
      message: error.message,
    });
  }
});

// General AI query endpoint
app.post("/api/query", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent(question);
    const response = await result.response;
    const text = response.text();

    res.json({
      success: true,
      answer: text,
    });
  } catch (error) {
    console.error("Error processing query:", error);
    res.status(500).json({
      error: "Failed to process query",
      message: error.message,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - GET  /api/health`);
  console.log(`   - POST /api/analyze`);
  console.log(`   - POST /api/recommendations`);
  console.log(`   - POST /api/query`);
});
