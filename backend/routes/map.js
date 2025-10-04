import express from 'express';

const router = express.Router();

// GET /api/map/locations - Get all map locations
router.get('/locations', (req, res) => {
  res.json({
    message: 'Get all map locations',
    locations: [
      {
        id: 1,
        name: 'Toronto City Hall',
        coordinates: [-79.3832, 43.6532],
        type: 'landmark'
      },
      {
        id: 2,
        name: 'CN Tower',
        coordinates: [-79.3871, 43.6426],
        type: 'landmark'
      }
    ]
  });
});

// POST /api/map/locations - Add new location
router.post('/locations', (req, res) => {
  const { name, coordinates, type } = req.body;
  
  if (!name || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    return res.status(400).json({
      error: 'Name and valid coordinates array [lng, lat] are required'
    });
  }

  res.status(201).json({
    message: 'Location added successfully',
    location: {
      id: Date.now(),
      name,
      coordinates,
      type: type || 'point'
    }
  });
});

// GET /api/map/search - Search locations
router.get('/search', (req, res) => {
  const { q, lat, lng, radius } = req.query;
  
  res.json({
    message: 'Search results',
    query: { q, lat, lng, radius },
    results: [
      {
        id: 1,
        name: 'Toronto City Hall',
        coordinates: [-79.3832, 43.6532],
        distance: '0.5km'
      }
    ]
  });
});

export default router;
