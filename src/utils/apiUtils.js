// Utility functions for calling population and building APIs

// Population API using Overpass
export async function getPopulationFor4Points(south, west, north, east) {
  const query = `[out:json][timeout:25];(node["place"]["population"](${south},${west},${north},${east}););out;`;
  
  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: query
    });
    
    const data = await response.json();
    
    let totalPopulation = 0;
    const places = data.elements.map(el => {
      const pop = parseInt(el.tags.population || 0);
      totalPopulation += pop;
      return {
        name: el.tags.name,
        population: pop,
        lat: el.lat,
        lon: el.lon
      };
    });
    
    // Calculate area in km²
    const earthRadius = 6371;
    const latDiff = Math.abs(north - south) * Math.PI / 180;
    const lonDiff = Math.abs(east - west) * Math.PI / 180;
    const avgLat = (south + north) / 2 * Math.PI / 180;
    const area = earthRadius * earthRadius * latDiff * lonDiff * Math.cos(avgLat);
    
    return {
      bbox: { south, west, north, east },
      total_population: totalPopulation,
      places: places,
      places_count: places.length,
      area_km2: parseFloat(area.toFixed(2)),
      density_per_km2: area > 0 ? parseFloat((totalPopulation / area).toFixed(2)) : 0,
      success: true
    };
    
  } catch (error) {
    return {
      error: error.message,
      success: false
    };
  }
}

// Building Analysis API using Overpass
export async function getBuildingAnalysis(south, west, north, east) {
  // Query for ALL buildings
  const allBuildingsQuery = `[out:json][timeout:30];
    (way["building"](${south},${west},${north},${east});
     node["building"](${south},${west},${north},${east});
     relation["building"](${south},${west},${north},${east}););
    out tags;`;
  
  // Query for essential services and amenities
  const servicesQuery = `[out:json][timeout:30];
    (node["amenity"~"hospital|school|university|clinic|pharmacy|fire_station|police|bank|restaurant|cafe|fuel|atm|post_office|library|theatre|cinema"](${south},${west},${north},${east});
     way["amenity"~"hospital|school|university|clinic|pharmacy|fire_station|police|bank|restaurant|cafe|fuel|atm|post_office|library|theatre|cinema"](${south},${west},${north},${east}););
    out tags;`;
  
  try {
    // Get all buildings
    const buildingResponse = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: allBuildingsQuery
    });
    const buildingData = await buildingResponse.json();
    
    // Get services
    const servicesResponse = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: servicesQuery
    });
    const servicesData = await servicesResponse.json();
    
    // Count building types
    const buildingCounts = {};
    const specificBuildings = {};
    
    buildingData.elements.forEach(el => {
      const type = el.tags.building || 'unknown';
      buildingCounts[type] = (buildingCounts[type] || 0) + 1;
      
      // Track specific buildings (not "yes")
      if (type !== 'yes' && type !== 'unknown') {
        specificBuildings[type] = (specificBuildings[type] || 0) + 1;
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
    
    // Calculate area in km²
    const earthRadius = 6371;
    const latDiff = Math.abs(north - south) * Math.PI / 180;
    const lonDiff = Math.abs(east - west) * Math.PI / 180;
    const avgLat = (south + north) / 2 * Math.PI / 180;
    const area = earthRadius * earthRadius * latDiff * lonDiff * Math.cos(avgLat);
    
    return {
      bbox: { south, west, north, east },
      area_km2: parseFloat(area.toFixed(2)),
      
      // Building statistics
      total_buildings: buildingData.elements.length,
      generic_buildings: buildingCounts.yes || 0,
      specific_buildings_count: Object.values(specificBuildings).reduce((a, b) => a + b, 0),
      
      // Detailed breakdowns
      all_building_types: buildingCounts,
      specific_building_types: specificBuildings,
      service_types: serviceCounts,
      
      // Summary categories
      summary: {
        residential: (specificBuildings.apartments || 0) + 
                    (specificBuildings.residential || 0) + 
                    (specificBuildings.house || 0) + 
                    (specificBuildings.terrace || 0),
        
        commercial: (specificBuildings.commercial || 0) + 
                   (specificBuildings.retail || 0) + 
                   (specificBuildings.office || 0),
        
        educational: (specificBuildings.school || 0) + 
                    (specificBuildings.university || 0) + 
                    (serviceCounts.school || 0) + 
                    (serviceCounts.university || 0),
        
        healthcare: (specificBuildings.hospital || 0) + 
                   (serviceCounts.hospital || 0) + 
                   (serviceCounts.clinic || 0) + 
                   (serviceCounts.pharmacy || 0),
        
        emergency_services: (serviceCounts.fire_station || 0) + 
                           (serviceCounts.police || 0),
        
        infrastructure: (specificBuildings.garage || 0) + 
                       (specificBuildings.shed || 0) + 
                       (specificBuildings.warehouse || 0),
        
        density_per_km2: area > 0 ? parseFloat((buildingData.elements.length / area).toFixed(2)) : 0
      },
      
      success: true
    };
    
  } catch (error) {
    return {
      error: error.message,
      success: false
    };
  }
}

// Combined analysis function
export async function getCompleteAreaAnalysis(south, west, north, east) {
  try {
    console.log(`🔍 Analyzing area: ${south.toFixed(4)}, ${west.toFixed(4)}, ${north.toFixed(4)}, ${east.toFixed(4)}`);
    
    // Get both population and building data in parallel
    const [populationData, buildingData] = await Promise.all([
      getPopulationFor4Points(south, west, north, east),
      getBuildingAnalysis(south, west, north, east)
    ]);
    
    return {
      bbox: { south, west, north, east },
      population: populationData,
      buildings: buildingData,
      
      // Combined summary
      summary: {
        area_km2: buildingData.area_km2,
        total_population: populationData.total_population,
        population_density: populationData.density_per_km2,
        total_buildings: buildingData.total_buildings,
        building_density: buildingData.summary.density_per_km2,
        
        // Critical infrastructure
        critical_facilities: {
          hospitals: buildingData.service_types.hospital || 0,
          schools: buildingData.service_types.school || 0,
          fire_stations: buildingData.service_types.fire_station || 0,
          police_stations: buildingData.service_types.police || 0
        },
        
        // Estimated impact
        residential_buildings: buildingData.summary.residential,
        estimated_affected_people: buildingData.summary.residential * 2.5, // Avg 2.5 people per unit
        
        // Data quality
        population_data_points: populationData.places_count,
        building_data_coverage: buildingData.specific_buildings_count > 0 ? 'Good' : 'Limited'
      },
      
      success: populationData.success && buildingData.success
    };
    
  } catch (error) {
    return {
      error: error.message,
      success: false
    };
  }
}
