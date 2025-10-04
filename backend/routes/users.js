import express from 'express';

const router = express.Router();

// GET /api/users - Get all users
router.get('/', (req, res) => {
  res.json({
    message: 'Get all users',
    users: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ]
  });
});

// GET /api/users/:id - Get user by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    message: `Get user with ID: ${id}`,
    user: { id: parseInt(id), name: 'John Doe', email: 'john@example.com' }
  });
});

// POST /api/users - Create new user
router.post('/', (req, res) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({
      error: 'Name and email are required'
    });
  }

  res.status(201).json({
    message: 'User created successfully',
    user: { id: Date.now(), name, email }
  });
});

// PUT /api/users/:id - Update user
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  
  res.json({
    message: `User ${id} updated successfully`,
    user: { id: parseInt(id), name, email }
  });
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  res.json({
    message: `User ${id} deleted successfully`
  });
});

export default router;
