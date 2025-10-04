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
├── components/           # Reusable components
│   ├── layout/          # Layout components (Layout, Header, Footer)
│   ├── ui/              # UI components (Button, Input, etc.)
│   └── index.js         # Component exports
├── hooks/               # Custom React hooks
│   ├── useLocalStorage.js
│   └── index.js
├── utils/               # Utility functions
│   └── index.js
├── styles/              # Global styles
│   └── globals.css
├── assets/              # Static assets (images, icons)
├── App.jsx              # Main App component
├── App.css              # App-specific styles
├── main.jsx             # Application entry point
└── index.css            # Base styles
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

Start building your application by adding new components to the appropriate directories!
