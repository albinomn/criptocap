import { describe, it, expect } from 'vitest'
import { cryptoData } from './mockCryptoData'

describe('mockCryptoData', () => {
  it('should have 5 cryptocurrencies', () => {
    expect(cryptoData).toHaveLength(5)
  })

  it('should have all required properties for each crypto', () => {
    cryptoData.forEach(crypto => {
      expect(crypto).toHaveProperty('id')
      expect(crypto).toHaveProperty('name')
      expect(crypto).toHaveProperty('symbol')
      expect(crypto).toHaveProperty('price')
      expect(crypto).toHaveProperty('change24h')
      expect(crypto).toHaveProperty('marketCap')
      expect(crypto).toHaveProperty('volume24h')
      expect(crypto).toHaveProperty('description')
      expect(crypto).toHaveProperty('supply')
      expect(crypto).toHaveProperty('rank')
    })
  })

  it('should have unique IDs', () => {
    const ids = cryptoData.map(crypto => crypto.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(cryptoData.length)
  })

  it('should have unique ranks', () => {
    const ranks = cryptoData.map(crypto => crypto.rank)
    const uniqueRanks = new Set(ranks)
    expect(uniqueRanks.size).toBe(cryptoData.length)
  })

  it('should have ranks in ascending order', () => {
    const ranks = cryptoData.map(crypto => crypto.rank)
    const sortedRanks = [...ranks].sort((a, b) => a - b)
    expect(ranks).toEqual(sortedRanks)
  })

  it('should have valid price values', () => {
    cryptoData.forEach(crypto => {
      expect(crypto.price).toBeGreaterThan(0)
      expect(typeof crypto.price).toBe('number')
    })
  })

  it('should have valid marketCap values', () => {
    cryptoData.forEach(crypto => {
      expect(crypto.marketCap).toBeGreaterThan(0)
      expect(typeof crypto.marketCap).toBe('number')
    })
  })

  it('should have valid volume24h values', () => {
    cryptoData.forEach(crypto => {
      expect(crypto.volume24h).toBeGreaterThan(0)
      expect(typeof crypto.volume24h).toBe('number')
    })
  })

  it('should have valid supply values', () => {
    cryptoData.forEach(crypto => {
      expect(crypto.supply).toBeGreaterThan(0)
      expect(typeof crypto.supply).toBe('number')
    })
  })

  it('should have both positive and negative change24h values', () => {
    const hasPositive = cryptoData.some(crypto => crypto.change24h > 0)
    const hasNegative = cryptoData.some(crypto => crypto.change24h < 0)

    expect(hasPositive).toBe(true)
    expect(hasNegative).toBe(true)
  })

  it('should have non-empty descriptions', () => {
    cryptoData.forEach(crypto => {
      expect(crypto.description.length).toBeGreaterThan(0)
      expect(typeof crypto.description).toBe('string')
    })
  })

  it('should have non-empty symbols', () => {
    cryptoData.forEach(crypto => {
      expect(crypto.symbol.length).toBeGreaterThan(0)
      expect(typeof crypto.symbol).toBe('string')
    })
  })

  it('should have symbols in uppercase', () => {
    cryptoData.forEach(crypto => {
      expect(crypto.symbol).toBe(crypto.symbol.toUpperCase())
    })
  })

  describe('specific cryptocurrencies', () => {
    it('should include Bitcoin as rank 1', () => {
      const bitcoin = cryptoData.find(crypto => crypto.symbol === 'BTC')
      expect(bitcoin).toBeDefined()
      expect(bitcoin?.id).toBe('bitcoin')
      expect(bitcoin?.name).toBe('Bitcoin')
      expect(bitcoin?.rank).toBe(1)
    })

    it('should include Ethereum as rank 2', () => {
      const ethereum = cryptoData.find(crypto => crypto.symbol === 'ETH')
      expect(ethereum).toBeDefined()
      expect(ethereum?.id).toBe('ethereum')
      expect(ethereum?.name).toBe('Ethereum')
      expect(ethereum?.rank).toBe(2)
    })

    it('should include Binance Coin as rank 3', () => {
      const bnb = cryptoData.find(crypto => crypto.symbol === 'BNB')
      expect(bnb).toBeDefined()
      expect(bnb?.id).toBe('binancecoin')
      expect(bnb?.name).toBe('Binance Coin')
      expect(bnb?.rank).toBe(3)
    })

    it('should include Cardano as rank 4', () => {
      const cardano = cryptoData.find(crypto => crypto.symbol === 'ADA')
      expect(cardano).toBeDefined()
      expect(cardano?.id).toBe('cardano')
      expect(cardano?.name).toBe('Cardano')
      expect(cardano?.rank).toBe(4)
    })

    it('should include Solana as rank 5', () => {
      const solana = cryptoData.find(crypto => crypto.symbol === 'SOL')
      expect(solana).toBeDefined()
      expect(solana?.id).toBe('solana')
      expect(solana?.name).toBe('Solana')
      expect(solana?.rank).toBe(5)
    })
  })
})
