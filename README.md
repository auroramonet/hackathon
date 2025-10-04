# React Project

A clean, component-based React application built with Vite following best practices.

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── backend/             # Backend server
│   └── index.js         # Express server with Gemini AI integration
├── components/          # Reusable components
│   ├── layout/         # Layout components
│   └── ui/             # UI components (Map, Drawing tools, etc.)
├── hooks/              # Custom React hooks
│   └── useLocalStorage.js
├── services/           # API service layer
│   └── api.js          # Backend API calls
├── styles/             # Global styles
│   └── globals.css
├── App.jsx             # Main App component
├── App.css             # App-specific styles
├── main.jsx            # Application entry point
└── index.css           # Base styles
```

## 🧱 Component Architecture

This project follows a **Lego-like component architecture**:

- **Atomic Design**: Components are built from small, reusable pieces
- **Single Responsibility**: Each component has one clear purpose
- **Composition over Inheritance**: Components are composed together
- **Consistent API**: Similar props and patterns across components

### Component Guidelines

1. **Keep components small and focused**
2. **Use descriptive prop names**
3. **Include PropTypes or TypeScript for type safety**
4. **Co-locate styles with components**
5. **Export from index files for clean imports**

## 🎨 Styling

- **CSS Modules**: Component-scoped styles
- **Global styles**: Reset and base styles in `src/styles/globals.css`
- **Consistent naming**: BEM-like class naming convention

## 🔧 Development

- **Vite**: Fast build tool and dev server
- **ESLint**: Code linting and formatting
- **React 19**: Latest React features
- **Modern JavaScript**: ES6+ features and modules

## 📦 Available Components

### Layout

- `Layout`: Main application layout wrapper

### UI

- `Button`: Flexible button component with variants and sizes

### Hooks

- `useLocalStorage`: Persistent state with localStorage

### Utils

- `cn`: Class name utility function
- `formatDate`: Date formatting utility

## 🔌 Backend API Endpoints

The backend server runs on **port 3001** and provides the following endpoints:

### `POST /api/analyze`

Analyze a drawn catastrophe area with AI.

**Request:**

```json
{
  "coordinates": [[lng, lat], ...],
  "magnitude": 5.0,
  "center": [lng, lat],
  "placeName": "Location name"
}
```

### `POST /api/recommendations`

Get disaster-specific recommendations.

### `POST /api/query`

General AI question answering.

### `GET /api/health`

Server health check.

## 🎯 How to Use

1. **Search** for a location using the search box
2. **Enable drawing** by clicking the Draw button
3. **Set magnitude** using the slider (0-10)
4. **Draw an area** by clicking and dragging on the map
5. **View AI analysis** that appears automatically

The drawn area will appear as a red 3D polygon, with height based on the magnitude level.

## 📝 Environment Setup

Create a `.env` file:

```env
VITE_MAPBOX_TOKEN=your_mapbox_token_here
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```
