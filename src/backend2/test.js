import fs from 'fs';
import GeoTIFF from 'geotiff';
import path from 'path';

const tiffPath = path.resolve('data', 'COD_population_v4_3_upper.tif');

const rectangle = {
  minLon: 20.0,  // Within the data bounds (12.2 to 31.3)
  maxLon: 21.0,
  minLat: -5.0,  // Within the data bounds (-13.4 to 4.8)
  maxLat: -4.0
};

async function getPopulationDensity(tiffPath, rectangle) {
  // Read file and convert to ArrayBuffer
  const tiffBuffer = fs.readFileSync(tiffPath);
  const arrayBuffer = tiffBuffer.buffer.slice(tiffBuffer.byteOffset, tiffBuffer.byteOffset + tiffBuffer.byteLength);
  
  // Create a proper source object
  const source = {
    fetch: async (ranges) => {
      return ranges.map(range => {
        const start = range.offset;
        const end = start + range.length;
        return arrayBuffer.slice(start, end);
      });
    }
  };
  const tiff = await GeoTIFF.fromSource(source);
  
  const image = await tiff.getImage();
  const width = image.getWidth();
  const height = image.getHeight();
  const rasters = await image.readRasters();

  const tiepoint = image.getTiePoints()[0];
  const pixelScale = image.getFileDirectory().ModelPixelScale;

  // Calculate the actual bounds of the data
  const minLon = tiepoint.x;
  const maxLon = tiepoint.x + width * pixelScale[0];
  const minLat = tiepoint.y - height * pixelScale[1];
  const maxLat = tiepoint.y;

  // Use the provided rectangle if it's within bounds, otherwise use a default area
  const dataRectangle = {
    minLon: Math.max(rectangle.minLon, minLon),
    maxLon: Math.min(rectangle.maxLon, maxLon),
    minLat: Math.max(rectangle.minLat, minLat),
    maxLat: Math.min(rectangle.maxLat, maxLat)
  };

  let totalPopulation = 0;
  let count = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const lon = tiepoint.x + x * pixelScale[0];
      const lat = tiepoint.y - y * pixelScale[1];

      if (
        lon >= dataRectangle.minLon && lon <= dataRectangle.maxLon &&
        lat >= dataRectangle.minLat && lat <= dataRectangle.maxLat
      ) {
        const value = rasters[0][y * width + x];
        if (!isNaN(value) && value > 0) {  // Also check for positive values
          totalPopulation += value;
          count++;
        }
      }
    }
  }

  // Calculate area of the rectangle in square kilometers
  // Each pixel represents approximately (pixelScale[0] * 111) km by (pixelScale[1] * 111) km
  // where 111 km is the approximate distance of 1 degree of latitude
  const pixelAreaKm2 = (pixelScale[0] * 111) * (pixelScale[1] * 111);
  const totalAreaKm2 = count * pixelAreaKm2;
  
  const averageDensity = count > 0 ? totalPopulation / count : 0;
  const densityPerKm2 = totalAreaKm2 > 0 ? totalPopulation / totalAreaKm2 : 0;

  return {
    totalPopulation: Math.round(totalPopulation),
    averageDensityPerPixel: Math.round(averageDensity),
    densityPerKm2: Math.round(densityPerKm2),
    totalAreaKm2: Math.round(totalAreaKm2),
    pixelCount: count,
    explanation: `The density of ${Math.round(averageDensity)} is calculated by dividing the total population (${Math.round(totalPopulation)}) by the number of pixels (${count}) in the specified area. Each pixel represents approximately ${pixelAreaKm2.toFixed(6)} km².`
  };
}

(async () => {
  const result = await getPopulationDensity(tiffPath, rectangle);
  console.log('=== Population Analysis Results ===');
  console.log(`Total Estimated Population: ${result.totalPopulation.toLocaleString()}`);
  console.log(`Average Density per Pixel: ${result.averageDensityPerPixel}`);
  console.log(`Density per km²: ${result.densityPerKm2}`);
  console.log(`Total Area: ${result.totalAreaKm2} km²`);
  console.log(`Number of Pixels: ${result.pixelCount.toLocaleString()}`);
  console.log('\n=== Calculation Explanation ===');
  console.log(result.explanation);
})();
