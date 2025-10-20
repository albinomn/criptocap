import { vi } from 'vitest'
import type { Crypto } from '../../types/crypto'

interface CachedPrice {
  id: string
  price: number
  timestamp: number
}

// In-memory storage para simular IndexedDB
let pricesStore: CachedPrice[] = []
let customCryptosStore: Crypto[] = []

export const mockCryptoCache = {
  init: vi.fn().mockResolvedValue(undefined),

  getAllPrices: vi.fn(async (): Promise<CachedPrice[]> => {
    return [...pricesStore]
  }),

  getPrice: vi.fn(async (id: string): Promise<CachedPrice | null> => {
    const price = pricesStore.find(p => p.id === id)
    return price || null
  }),

  savePrice: vi.fn(async (id: string, price: number): Promise<void> => {
    const timestamp = Date.now()
    const existingIndex = pricesStore.findIndex(p => p.id === id)

    if (existingIndex >= 0) {
      pricesStore[existingIndex] = { id, price, timestamp }
    } else {
      pricesStore.push({ id, price, timestamp })
    }

    // Mantém apenas os últimos 10 preços por asset
    const assetPrices = pricesStore.filter(p => p.id === id)
    if (assetPrices.length > 10) {
      const toRemove = assetPrices.length - 10
      pricesStore = pricesStore.filter(p => {
        if (p.id === id) {
          return assetPrices.indexOf(p) >= toRemove
        }
        return true
      })
    }
  }),

  deletePrice: vi.fn(async (id: string): Promise<void> => {
    pricesStore = pricesStore.filter(p => p.id !== id)
  }),

  clearOldPrices: vi.fn(async (maxAge = 24 * 60 * 60 * 1000): Promise<void> => {
    const now = Date.now()
    pricesStore = pricesStore.filter(p => now - p.timestamp < maxAge)
  }),

  getAllCustomCryptos: vi.fn(async (): Promise<Crypto[]> => {
    return [...customCryptosStore]
  }),

  saveCustomCrypto: vi.fn(async (crypto: Crypto): Promise<void> => {
    const existingIndex = customCryptosStore.findIndex(c => c.id === crypto.id)

    if (existingIndex >= 0) {
      customCryptosStore[existingIndex] = crypto
    } else {
      customCryptosStore.push(crypto)
    }
  }),

  deleteCustomCrypto: vi.fn(async (id: string): Promise<void> => {
    customCryptosStore = customCryptosStore.filter(c => c.id !== id)
  }),

  // Helper para resetar os stores entre testes
  __reset: () => {
    pricesStore = []
    customCryptosStore = []
  }
}
