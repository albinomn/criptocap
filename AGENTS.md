# AGENTS.md - Development Guidelines for AI Coding Agents

## Commands
- **Dev**: `npm run dev` (start with hot reload)
- **Build**: `npm run build` (TypeScript + Vite)
- **Lint**: `npm run lint` (ESLint with flat config)
- **Test**: `npm test` (Vitest watch mode)
- **Single Test**: `npm test -- src/components/CryptoList.test.tsx --run`
- **Test Coverage**: `npm run test:coverage`

## Code Style & Conventions
- **TypeScript**: Strict mode, ES2022 target, no unused locals/parameters
- **Imports**: Use `type` imports for types (`import type { Crypto } from "../types/crypto"`)
- **Components**: Default exports, PascalCase filenames, co-located tests (`.test.tsx`)
- **Interfaces**: No semicolons in type definitions (see `crypto.ts`)
- **Functions**: Prefer arrow functions for utilities, function declarations for components
- **Formatting**: Double quotes for strings, no trailing semicolons in objects
- **Comments**: Portuguese comments for business logic, English for technical details

## Testing Patterns
- **Framework**: Vitest + React Testing Library + user-event
- **Mocking**: Use `vi.hoisted()` for mock creation, avoid shared mocks in `src/test/mocks/`
- **IndexedDB**: Always mock with in-memory arrays, never use real IndexedDB in tests
- **Async**: Use `waitFor()` for WebSocket updates and async state changes
- **Reset**: Call `mockCache.__reset()` in `beforeEach` for clean test state