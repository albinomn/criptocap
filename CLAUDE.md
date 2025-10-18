# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript + Vite project using SWC for Fast Refresh. The project is named "coincap" (based on package.json) but appears to be a standard Vite React template setup.

## Development Commands

```bash
# Start development server with hot module replacement
npm run dev

# Build for production (runs TypeScript compiler and Vite build)
npm run build

# Lint the codebase
npm run lint

# Preview production build
npm run preview
```

## TypeScript Configuration

The project uses a multi-config TypeScript setup:
- `tsconfig.json` - Root config that references app and node configs
- `tsconfig.app.json` - Main application config for `src/` directory
- `tsconfig.node.json` - Config for Vite/Node tooling

TypeScript is configured with strict mode enabled and includes strict linting rules:
- `noUnusedLocals` and `noUnusedParameters` are enabled
- `noFallthroughCasesInSwitch` is enabled
- `noUncheckedSideEffectImports` is enabled
- Uses modern ES2022 target with bundler module resolution

## Build Tooling

**Vite**: Uses `@vitejs/plugin-react-swc` for Fast Refresh via SWC (not Babel).

**Important**: The React Compiler is currently not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428) for tracking progress.

**ESLint**: Uses flat config format (`eslint.config.js`) with:
- JavaScript recommended rules
- TypeScript ESLint recommended rules
- React Hooks recommended rules
- React Refresh rules for Vite

The `dist` directory is globally ignored by ESLint.

## Project Structure

```
src/
├── App.tsx         # Main application component
├── main.tsx        # Application entry point (renders App in StrictMode)
├── App.css         # App component styles
├── index.css       # Global styles
└── assets/         # Static assets (images, etc.)
```

Entry point: `main.tsx` uses `createRoot` from React 19 and renders the App component in StrictMode.
