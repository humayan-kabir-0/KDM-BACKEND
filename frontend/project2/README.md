# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
# Cosmic Portfolio — Setup Guide

## Install Dependencies

```bash
npm create vite@latest my-portfolio -- --template react
cd my-portfolio

npm install framer-motion
npm install @react-three/fiber @react-three/drei three
npm install @tailwindcss/vite tailwindcss
```

## File Placement

```
my-portfolio/
├── src/
│   ├── App.jsx          ← replace with provided App.jsx
│   ├── Hero.jsx         ← add provided Hero.jsx
│   └── index.css        ← replace with provided index.css
├── vite.config.js       ← replace with provided vite.config.js
└── tailwind.config.js   ← add provided tailwind.config.js
```

## Run

```bash
npm run dev
```

## main.jsx (keep default but import index.css)

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

## Notes
- Node.js 18+ recommended
- The 3D scene uses React Three Fiber — GPU-accelerated via WebGL
- Custom cursor hides system cursor via CSS; works on all modern browsers
- On mobile: cursor effects are skipped automatically (touch devices)