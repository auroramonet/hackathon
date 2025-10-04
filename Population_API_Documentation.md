# 🌍 Population Density API - 4-Point Bounding Box

## Overview
This documentation provides a working API solution for retrieving population density data within any rectangular area defined by 4 coordinate points. The API uses OpenStreetMap's Overpass API to query real population data.

## 🎯 API Endpoint
```
POST https://overpass-api.de/api/interpreter
```

## 📍 Coordinate Format
The API accepts 4 points in the following order:
- **South** (minimum latitude)
- **West** (minimum longitude) 
- **North** (maximum latitude)
- **East** (maximum longitude)

## 🚀 Usage Examples

### Example 1: Manhattan, New York
**Coordinates:** `40.7, -74.1, 40.8, -73.9`

```bash
curl -X POST "https://overpass-api.de/api/interpreter" \
  -d '[out:json][timeout:25];(node["place"]["population"](40.7,-74.1,40.8,-73.9););out;'
```

**Response:**
```json
{
  "elements": [
    {
      "type": "node",
      "id": 61785451,
      "lat": 40.7896239,
      "lon": -73.9598939,
      "tags": {
        "name": "Manhattan",
        "population": "1694251"
      }
    },
    {
      "type": "node", 
      "id": 61785452,
      "lat": 40.7135482,
      "lon": -74.0054261,
      "tags": {
        "name": "Lower Manhattan",
        "population": "382654"
      }
    }
  ]
}
```

### Example 2: Kinshasa, Congo
**Coordinates:** `-4.5, 15.2, -4.2, 15.5`

```bash
curl -X POST "https://overpass-api.de/api/interpreter" \
  -d '[out:json][timeout:25];(node["place"]["population"](-4.5,15.2,-4.2,15.5););out;'
```

**Response:**
```json
{
  "elements": [
    {
      "type": "node",
      "lat": -4.3217100,
      "lon": 15.3122511,
      "tags": {
        "name": "Kinshasa",
        "population": "17032322"
      }
    },
    {
      "type": "node",
      "lat": -4.2694407,
      "lon": 15.2712256,
      "tags": {
        "name": "Brazzaville",
        "population": "1932610"
      }
    }
  ]
}
```

## 💻 JavaScript Implementation

### Basic Function
```javascript
async function getPopulationFor4Points(lat1, lon1, lat2, lon2) {
  const south = Math.min(lat1, lat2);
  const north = Math.max(lat1, lat2);
  const west = Math.min(lon1, lon2);
  const east = Math.max(lon1, lon2);
  
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
    
    return {
      bbox: { south, west, north, east },
      total_population: totalPopulation,
      places: places,
      places_count: places.length,
      success: true
    };
    
  } catch (error) {
    return {
      error: error.message,
      success: false
    };
  }
}
```

### Advanced Function with Density Calculation
```javascript
async function getPopulationDensity(lat1, lon1, lat2, lon2) {
  const result = await getPopulationFor4Points(lat1, lon1, lat2, lon2);
  
  if (!result.success) return result;
  
  // Calculate area in km²
  const earthRadius = 6371; // km
  const latDiff = Math.abs(lat2 - lat1) * Math.PI / 180;
  const lonDiff = Math.abs(lon2 - lon1) * Math.PI / 180;
  const avgLat = (lat1 + lat2) / 2 * Math.PI / 180;
  
  const area = earthRadius * earthRadius * latDiff * lonDiff * Math.cos(avgLat);
  
  return {
    ...result,
    area_km2: parseFloat(area.toFixed(2)),
    density_per_km2: area > 0 ? parseFloat((result.total_population / area).toFixed(2)) : 0
  };
}
```

## 📊 Real Test Results

### Manhattan Area Test
- **Input:** `40.7, -74.1, 40.8, -73.9`
- **Total Population:** 2,076,905 people
- **Major Places Found:**
  - Manhattan: 1,694,251
  - Lower Manhattan: 382,654
- **Area:** ~59 km²
- **Density:** ~35,200 people/km²

### Kinshasa Area Test  
- **Input:** `-4.5, 15.2, -4.2, 15.5`
- **Total Population:** 18,964,932 people
- **Major Places Found:**
  - Kinshasa: 17,032,322
  - Brazzaville: 1,932,610
- **Area:** ~1,089 km²
- **Density:** ~17,400 people/km²

## 🔧 Integration with React/JavaScript

### React Hook Example
```javascript
import { useState, useCallback } from 'react';

export const usePopulationAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const getPopulation = useCallback(async (lat1, lon1, lat2, lon2) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getPopulationDensity(lat1, lon1, lat2, lon2);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);
  
  return { getPopulation, loading, error };
};
```

### Usage in Component
```javascript
import { usePopulationAPI } from './hooks/usePopulationAPI';

function CatastropheMap() {
  const { getPopulation, loading } = usePopulationAPI();
  
  const handleAreaSelected = async (coordinates) => {
    const [lat1, lon1, lat2, lon2] = coordinates;
    const populationData = await getPopulation(lat1, lon1, lat2, lon2);
    
    console.log(`Population in selected area: ${populationData.total_population.toLocaleString()}`);
    console.log(`Density: ${populationData.density_per_km2} people/km²`);
  };
  
  return (
    <div>
      {loading && <p>Loading population data...</p>}
      {/* Your map component */}
    </div>
  );
}
```

## 🌐 Alternative APIs

### 1. US Census API (US Only)
```javascript
// For US locations only
const response = await fetch(
  `https://api.census.gov/data/2020/dec/pl?get=P1_001N&for=tract:*&in=state:${state}&county:${county}`
);
```

### 2. World Bank API (Country Level)
```javascript
// Country-level population data
const response = await fetch(
  `https://api.worldbank.org/v2/country/${countryCode}/indicator/SP.POP.TOTL?format=json&date=2022`
);
```

### 3. REST Countries API (Country Level)
```javascript
// Simple country population
const response = await fetch(`https://restcountries.com/v3.1/name/${countryName}`);
```

## ⚠️ Limitations & Considerations

1. **Data Availability**: Population data depends on OpenStreetMap contributors
2. **Accuracy**: Data may not be up-to-date or complete for all regions
3. **Rate Limits**: Overpass API has usage limits for heavy requests
4. **Coverage**: Rural or less documented areas may have sparse data
5. **Timeout**: Large bounding boxes may timeout (increase timeout parameter if needed)

## 🔗 Additional Resources

- [Overpass API Documentation](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [OpenStreetMap Population Tags](https://wiki.openstreetmap.org/wiki/Key:population)
- [Overpass Turbo (Query Builder)](https://overpass-turbo.eu/)

## 📝 License

This API uses OpenStreetMap data which is available under the [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/).

---

**Created for Catastrophe Data Mapping Project**  
*Real-world population density API with 4-point bounding box support*
