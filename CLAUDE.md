# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a cryptocurrency tracking application built with React 19 + TypeScript + Vite using SWC for Fast Refresh. The application displays real-time cryptocurrency data with WebSocket integration, IndexedDB caching, expandable card layouts, and price history charts using Recharts.

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

# Run tests in watch mode
npm run test

# Run tests once (for CI/CD)
npm run test:run

# Run a specific test file
npm test -- src/components/CryptoList.test.tsx --run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Architecture Overview

### Real-Time Data Flow

The application uses a WebSocket connection to CoinCap API for real-time price updates, combined with IndexedDB for persistent caching:

```
WebSocket (CoinCap API)
         ↓
   useCryptoPrices() hook
         ↓
    { prices, isConnected, error, invalidAssets }
         ↓
    CryptoList Component
         ↓
    IndexedDB Cache (cryptoCache service)
         ↓
    UI with Price History Charts
```

### Component Structure

- **Components** (`src/components/`):
  - `CryptoList.tsx` - Main component with 6-column grid layout (#, Ticker, Nome, Preço, 24h, Ações)
  - `AddCryptoModal.tsx` - Modal for searching and adding custom cryptocurrencies
  - Both components have co-located test files
  - Grid uses Tailwind arbitrary values: `grid-cols-[minmax(3rem,auto)_auto_1fr_auto_auto_auto]`
  - Mobile responsive layout with flex columns (no overlap)

- **Hooks** (`src/hooks/`):
  - `useCryptoPrices.ts` - WebSocket connection manager with invalid asset detection
  - `useCryptoSearch.ts` - CoinCap API integration for searching cryptocurrencies
  - Both hooks handle automatic reconnection and error states

- **Services** (`src/services/`):
  - `cryptoCache.ts` - IndexedDB wrapper for persistent storage of prices and custom cryptocurrencies
  - Stores last 10 price updates per asset with timestamps
  - Auto-cleanup of old data (24h default)

- **Data Layer** (`src/data/`):
  - `mockCryptoData.ts` - Default cryptocurrency data (Bitcoin, Ethereum, BNB, Cardano, Solana)

- **Types** (`src/types/`):
  - `crypto.ts` - Crypto interface with all required fields

- **Utils** (`src/utils/`):
  - `formatters.ts` - Number and currency formatting using `Intl.NumberFormat` with `pt-BR` locale

### Key Features

1. **Real-Time Price Updates**: WebSocket connection to `wss://ws.coincap.io/prices`
2. **Invalid Asset Detection**: Automatically removes assets after 3 consecutive null/undefined values
3. **Price History**: Stores and displays last 10 price updates with timestamps
4. **Charts**: Line charts using Recharts library for price visualization
5. **Custom Cryptocurrencies**: Users can search and add new cryptocurrencies via modal
6. **Delete Functionality**: Remove cryptocurrencies with confirmation dialog
7. **IndexedDB Caching**: Persists prices and custom cryptos across sessions

### State Management

- Local component state with `useState` and `useEffect`
- Custom hooks for WebSocket and API integration
- IndexedDB for persistent storage
- No global state management library

### WebSocket Integration

**Endpoint**: `wss://ws.coincap.io/prices?assets=bitcoin,ethereum,binance-coin,cardano,solana,...`

**ID Normalization**: The API uses `binance-coin` (with hyphen) but the app uses `binancecoin` internally. The `useCryptoPrices` hook handles this normalization automatically via `ASSET_ID_MAP`.

**Invalid Assets**: Assets that return null/undefined for 3 consecutive WebSocket messages are marked as invalid and automatically removed from the list.

**Custom Assets**: When custom cryptocurrencies are added, their IDs are passed to the WebSocket connection dynamically.

## Styling with Tailwind CSS

**Tailwind v4** configured via Vite plugin:
- Import in `src/App.css`: `@import "tailwindcss";`
- Dark theme with gray/blue/purple color scheme
- Responsive design with mobile-first approach
- Custom grid templates using arbitrary values

**Grid Layout**:
- Desktop: 6 columns with custom widths
- Mobile: Flex layout to prevent overlap
- Rank column has minimum width of 3rem (accommodates up to 999)

## TypeScript Configuration

Multi-config setup with strict mode:
- `tsconfig.json` - Root config
- `tsconfig.app.json` - Application code (`src/`)
- `tsconfig.node.json` - Vite/Node tooling

Strict linting enabled:
- `noUnusedLocals` and `noUnusedParameters`
- `noFallthroughCasesInSwitch`
- `noUncheckedSideEffectImports`
- ES2022 target with bundler module resolution

## Build Tooling

**Vite**: Uses `@vitejs/plugin-react-swc` for Fast Refresh via SWC (not Babel) and `@tailwindcss/vite`.

**Important**: React Compiler is not compatible with SWC. See [this issue](https://github.com/vitejs/vite-plugin-react/issues/428).

**ESLint**: Flat config format (`eslint.config.js`) with:
- JavaScript recommended rules
- TypeScript ESLint recommended rules
- React Hooks recommended rules
- React Refresh rules for Vite
- `dist` directory globally ignored

**Vitest**: Configured in `vite.config.ts`:
- jsdom environment for DOM testing
- Global test APIs enabled
- Setup file: `src/test/setup.ts` with jest-dom matchers

## Testing Strategy

**Framework**: Vitest + React Testing Library + @testing-library/user-event

**Test Organization**:
- Co-located test files with source files (`.test.ts` or `.test.tsx`)
- Mock files in `src/test/mocks/` (currently contains `cryptoCache.ts`)
- Use `vi.hoisted()` for creating mocks to avoid hoisting issues

**Mocking IndexedDB**:
When testing components that use IndexedDB, create mocks using in-memory arrays:

```typescript
const mockCryptoCache = vi.hoisted(() => {
  const pricesStore: Array<{ id: string; price: number; timestamp: number }> = []
  const customCryptosStore: Array<Crypto> = []

  return {
    init: vi.fn().mockResolvedValue(undefined),
    getAllPrices: vi.fn(async () => [...pricesStore]),
    savePrice: vi.fn(async (id, price) => { /* implementation */ }),
    // ... other methods
    __reset: () => {
      pricesStore.length = 0
      customCryptosStore.length = 0
    }
  }
})

vi.mock('../services/cryptoCache', () => ({
  cryptoCache: mockCryptoCache
}))
```

**Testing Patterns**:
- Use `screen.getAllByText()` when multiple elements may match (e.g., "#", "Ticker", "Ações")
- Use `waitFor()` for async state changes and WebSocket updates
- Query by CSS classes for Tailwind-specific assertions (e.g., `.max-h-\[1000px\]`)
- Reset mocks in `beforeEach` and `afterEach` using `mockCache.__reset()`
- Use `vi.spyOn(window, 'confirm')` to test confirmation dialogs

**Current Test Coverage**:
- Component rendering and interactions
- WebSocket connection and message handling
- Invalid asset detection (3 consecutive null values)
- Delete functionality with confirmation
- Grid layout (desktop 6 columns, mobile flex)
- Mobile responsive layout (no overlap)
- Price history and caching
- Custom cryptocurrency search and addition
- Utility functions and formatters

## Project Structure

```
src/
├── components/
│   ├── CryptoList.tsx           # Main listing component with WebSocket
│   ├── CryptoList.test.tsx      # 31 tests
│   ├── AddCryptoModal.tsx       # Search and add cryptos
│   └── AddCryptoModal.test.tsx
├── hooks/
│   ├── useCryptoPrices.ts       # WebSocket manager + invalid detection
│   ├── useCryptoPrices.test.ts  # 16 tests
│   ├── useCryptoSearch.ts       # CoinCap API search
│   └── useCryptoSearch.test.ts
├── services/
│   ├── cryptoCache.ts           # IndexedDB wrapper
│   └── cryptoCache.test.ts
├── data/
│   ├── mockCryptoData.ts        # Default cryptocurrencies
│   └── mockCryptoData.test.ts
├── types/
│   └── crypto.ts                # TypeScript interfaces
├── utils/
│   ├── formatters.ts            # Number/currency formatting
│   └── formatters.test.ts
├── test/
│   ├── setup.ts                 # Test configuration
│   └── mocks/
│       └── cryptoCache.ts       # Shared mock (not used, prefer vi.hoisted)
├── App.tsx                      # App wrapper
├── App.css                      # Global styles with Tailwind import
└── main.tsx                     # Entry point (React 19 createRoot)
```

## Key Implementation Patterns

### Expandable Cards
- CSS transitions with `max-h-0` (collapsed) and `max-h-[1000px]` (expanded)
- Click handlers on card rows toggle expansion
- Only one card expanded at a time
- Detailed information (charts, price history) only rendered when expanded

### Number Formatting
- `formatPrice()` - USD currency with 2 decimal places (pt-BR locale)
- `formatNumber()` - Compact notation (e.g., "1.3T", "65B")

### Delete Functionality
- Confirmation dialog using `window.confirm()`
- Removes custom cryptos from IndexedDB and state
- Hides default cryptos (adds to `hiddenCryptos` Set)
- Event propagation stopped to prevent card expansion

### Price History
- Stores last 10 price updates with timestamps
- Displays in table and line chart (Recharts)
- Formatted time using `toLocaleTimeString('pt-BR')`
- Shows "Aguardando atualizações de preço" when no data

### Invalid Asset Handling
- Tracks consecutive errors per asset in `errorCountRef`
- Marks asset as invalid after 3 consecutive null/undefined values
- Automatically removes from display and clears cache
- Resets error count when valid value received

## API Integration

**CoinCap API**:
- WebSocket: `wss://ws.coincap.io/prices?assets=...`
- REST Search: `https://rest.coincap.io/v3/assets?search={query}&limit=10`
- Authorization: Bearer token in headers
- Returns price updates as JSON: `{ "bitcoin": "67234.50", ... }`

**Asset ID Mapping**:
```typescript
const ASSET_ID_MAP: Record<string, string> = {
  'binance-coin': 'binancecoin'
}
```

## Important Notes

1. **React 19**: Uses new `createRoot` API, ensure compatibility when upgrading dependencies
2. **Tailwind v4**: Different configuration than v3, uses `@import "tailwindcss"` instead of directives
3. **IndexedDB**: Not available in test environment (jsdom), always mock with arrays
4. **WebSocket**: Auto-reconnects every 3 seconds on disconnect, cleanup on unmount
5. **Portuguese (pt-BR)**: Locale used for number/date formatting throughout the app
6. **Grid Layout**: Uses Tailwind arbitrary values for custom column sizing
7. **Test Memory**: Running all tests at once may cause out-of-memory errors, run specific test files when developing
