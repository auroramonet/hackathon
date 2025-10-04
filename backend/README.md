# Hackathon Backend

A Node.js backend server built with Express.js for the hackathon project.

## Features

- Express.js server with middleware
- CORS enabled for frontend communication
- Security headers with Helmet
- Request logging with Morgan
- Error handling middleware
- RESTful API routes
- Environment variable configuration

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Edit `.env` file with your configuration:
   ```
   PORT=5000
   NODE_ENV=development
   ```

### Running the Server

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your .env file).

## API Endpoints

### Health Check
- `GET /health` - Server health status

### API Routes
- `GET /api` - API information
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/map/locations` - Get map locations
- `POST /api/map/locations` - Add new location
- `GET /api/map/search` - Search locations

## Project Structure

```
backend/
├── middleware/
│   └── errorMiddleware.js    # Error handling middleware
├── routes/
│   ├── api.js               # Main API router
│   ├── users.js             # User routes
│   └── map.js               # Map-related routes
├── .env.example             # Environment variables template
├── .gitignore              # Git ignore file
├── package.json            # Dependencies and scripts
├── README.md               # This file
└── server.js               # Main server file
```

## Adding New Features

1. Create new route files in the `routes/` directory
2. Import and use them in `routes/api.js`
3. Add any new middleware to `server.js`
4. Update this README with new endpoints

## Environment Variables

Copy `.env.example` to `.env` and configure:

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- Add database and API keys as needed
