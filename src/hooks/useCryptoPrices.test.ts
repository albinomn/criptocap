import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCryptoPrices } from './useCryptoPrices'

// Create mock using vi.hoisted to avoid hoisting issues
const mockCryptoCache = vi.hoisted(() => {
  const pricesStore: Array<{ id: string; price: number; timestamp: number }> = []
  const customCryptosStore: Array<any> = []

  return {
    init: vi.fn().mockResolvedValue(undefined),
    getAllPrices: vi.fn(async () => [...pricesStore]),
    getPrice: vi.fn(async (id: string) => pricesStore.find(p => p.id === id) || null),
    savePrice: vi.fn(async (id: string, price: number) => {
      const timestamp = Date.now()
      const existingIndex = pricesStore.findIndex(p => p.id === id)
      if (existingIndex >= 0) {
        pricesStore[existingIndex] = { id, price, timestamp }
      } else {
        pricesStore.push({ id, price, timestamp })
      }
    }),
    deletePrice: vi.fn(async (id: string) => {
      const index = pricesStore.findIndex(p => p.id === id)
      if (index >= 0) pricesStore.splice(index, 1)
    }),
    clearOldPrices: vi.fn().mockResolvedValue(undefined),
    getAllCustomCryptos: vi.fn(async () => [...customCryptosStore]),
    saveCustomCrypto: vi.fn(async (crypto: any) => {
      const existingIndex = customCryptosStore.findIndex(c => c.id === crypto.id)
      if (existingIndex >= 0) {
        customCryptosStore[existingIndex] = crypto
      } else {
        customCryptosStore.push(crypto)
      }
    }),
    deleteCustomCrypto: vi.fn(async (id: string) => {
      const index = customCryptosStore.findIndex(c => c.id === id)
      if (index >= 0) customCryptosStore.splice(index, 1)
    }),
    __reset: () => {
      pricesStore.length = 0
      customCryptosStore.length = 0
    }
  }
})

// Mock cryptoCache module
vi.mock('../services/cryptoCache', () => ({
  cryptoCache: mockCryptoCache
}))

describe('useCryptoPrices', () => {
  let mockWebSocket: {
    close: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
    onopen: (() => void) | null
    onmessage: ((event: MessageEvent) => void) | null
    onerror: ((event: Event) => void) | null
    onclose: (() => void) | null
  }

  beforeEach(() => {
    // Reset mock cache
    mockCryptoCache.__reset()

    // Mock WebSocket
    mockWebSocket = {
      close: vi.fn(),
      send: vi.fn(),
      onopen: null,
      onmessage: null,
      onerror: null,
      onclose: null
    }

    global.WebSocket = vi.fn(() => mockWebSocket) as unknown as typeof WebSocket
  })

  afterEach(() => {
    mockCryptoCache.__reset()
    vi.clearAllTimers()
    vi.restoreAllMocks()
  })

  it('should initialize with empty prices and disconnected state', () => {
    const { result } = renderHook(() => useCryptoPrices())

    expect(result.current.prices).toEqual({})
    expect(result.current.isConnected).toBe(false)
    expect(result.current.error).toBe(null)
    expect(result.current.invalidAssets).toEqual([])
  })

  it('should connect to WebSocket on mount', () => {
    renderHook(() => useCryptoPrices())

    expect(global.WebSocket).toHaveBeenCalledWith(
      'wss://ws.coincap.io/prices?assets=bitcoin,ethereum,binance-coin,cardano,solana'
    )
  })

  it('should set connected state when WebSocket opens', async () => {
    const { result } = renderHook(() => useCryptoPrices())

    // Simula abertura da conexão
    if (mockWebSocket.onopen) {
      mockWebSocket.onopen()
    }

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true)
    })
  })

  it('should update prices when receiving WebSocket message', async () => {
    const { result } = renderHook(() => useCryptoPrices())

    // Simula abertura da conexão
    if (mockWebSocket.onopen) {
      mockWebSocket.onopen()
    }

    // Simula recebimento de mensagem
    const mockPriceData = {
      bitcoin: '67234.5',
      ethereum: '3456.78'
    }

    const messageEvent = new MessageEvent('message', {
      data: JSON.stringify(mockPriceData)
    })

    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage(messageEvent)
    }

    await waitFor(() => {
      expect(result.current.prices).toEqual(mockPriceData)
    })
  })

  it('should handle WebSocket errors', async () => {
    const { result } = renderHook(() => useCryptoPrices())

    const errorEvent = new Event('error')

    if (mockWebSocket.onerror) {
      mockWebSocket.onerror(errorEvent)
    }

    await waitFor(() => {
      expect(result.current.error).toBe('Erro na conexão WebSocket')
      expect(result.current.isConnected).toBe(false)
    })
  })

  it('should close WebSocket on unmount', () => {
    const { unmount } = renderHook(() => useCryptoPrices())

    unmount()

    expect(mockWebSocket.close).toHaveBeenCalled()
  })

  it('should accumulate prices from multiple messages', async () => {
    const { result } = renderHook(() => useCryptoPrices())

    if (mockWebSocket.onopen) {
      mockWebSocket.onopen()
    }

    // Primeira mensagem
    const firstMessage = new MessageEvent('message', {
      data: JSON.stringify({ bitcoin: '67000' })
    })

    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage(firstMessage)
    }

    await waitFor(() => {
      expect(result.current.prices).toEqual({ bitcoin: '67000' })
    })

    // Segunda mensagem
    const secondMessage = new MessageEvent('message', {
      data: JSON.stringify({ ethereum: '3400' })
    })

    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage(secondMessage)
    }

    await waitFor(() => {
      expect(result.current.prices).toEqual({
        bitcoin: '67000',
        ethereum: '3400'
      })
    })
  })

  it('should normalize binance-coin to binancecoin', async () => {
    const { result } = renderHook(() => useCryptoPrices())

    if (mockWebSocket.onopen) {
      mockWebSocket.onopen()
    }

    // Simula mensagem com binance-coin (ID da API)
    const message = new MessageEvent('message', {
      data: JSON.stringify({ 'binance-coin': '589.23' })
    })

    if (mockWebSocket.onmessage) {
      mockWebSocket.onmessage(message)
    }

    await waitFor(() => {
      // Deve ser normalizado para binancecoin (ID interno)
      expect(result.current.prices).toEqual({
        binancecoin: '589.23'
      })
    })
  })

  describe('Invalid assets detection', () => {
    it('should detect invalid asset after 3 consecutive null values', async () => {
      const { result } = renderHook(() => useCryptoPrices())

      if (mockWebSocket.onopen) {
        mockWebSocket.onopen()
      }

      // Simula 3 mensagens consecutivas com valor null
      for (let i = 0; i < 3; i++) {
        const message = new MessageEvent('message', {
          data: JSON.stringify({ bitcoin: null })
        })

        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(message)
        }
      }

      await waitFor(() => {
        expect(result.current.invalidAssets).toContain('bitcoin')
      })
    })

    it('should detect invalid asset after 3 consecutive null values for ethereum', async () => {
      const { result } = renderHook(() => useCryptoPrices())

      if (mockWebSocket.onopen) {
        mockWebSocket.onopen()
      }

      // Simula 3 mensagens consecutivas com valor null para ethereum
      // (JSON.stringify remove undefined, então usamos null)
      for (let i = 0; i < 3; i++) {
        const message = new MessageEvent('message', {
          data: JSON.stringify({ ethereum: null })
        })

        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(message)
        }
      }

      await waitFor(() => {
        expect(result.current.invalidAssets).toContain('ethereum')
      })
    })

    it('should reset error count when receiving valid value', async () => {
      const { result } = renderHook(() => useCryptoPrices())

      if (mockWebSocket.onopen) {
        mockWebSocket.onopen()
      }

      // Simula 2 mensagens com null
      for (let i = 0; i < 2; i++) {
        const nullMessage = new MessageEvent('message', {
          data: JSON.stringify({ cardano: null })
        })

        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(nullMessage)
        }
      }

      // Simula mensagem com valor válido
      const validMessage = new MessageEvent('message', {
        data: JSON.stringify({ cardano: '0.45' })
      })

      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(validMessage)
      }

      await waitFor(() => {
        expect(result.current.prices).toHaveProperty('cardano', '0.45')
      })

      // Simula mais 2 mensagens null (deveria precisar de 3 para marcar como inválido)
      for (let i = 0; i < 2; i++) {
        const nullMessage = new MessageEvent('message', {
          data: JSON.stringify({ cardano: null })
        })

        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(nullMessage)
        }
      }

      // Não deve marcar como inválido ainda (só teve 2 erros após reset)
      await waitFor(() => {
        expect(result.current.invalidAssets).not.toContain('cardano')
      })
    })

    it('should handle string "null" as invalid value', async () => {
      const { result } = renderHook(() => useCryptoPrices())

      if (mockWebSocket.onopen) {
        mockWebSocket.onopen()
      }

      // Simula 3 mensagens com string "null"
      for (let i = 0; i < 3; i++) {
        const message = new MessageEvent('message', {
          data: JSON.stringify({ solana: 'null' })
        })

        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(message)
        }
      }

      await waitFor(() => {
        expect(result.current.invalidAssets).toContain('solana')
      })
    })

    it('should handle string "undefined" as invalid value', async () => {
      const { result } = renderHook(() => useCryptoPrices())

      if (mockWebSocket.onopen) {
        mockWebSocket.onopen()
      }

      // Simula 3 mensagens com string "undefined"
      for (let i = 0; i < 3; i++) {
        const message = new MessageEvent('message', {
          data: JSON.stringify({ 'binance-coin': 'undefined' })
        })

        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(message)
        }
      }

      await waitFor(() => {
        // Deve normalizar binance-coin para binancecoin antes de marcar como inválido
        expect(result.current.invalidAssets).toContain('binancecoin')
      })
    })

    it('should accumulate multiple invalid assets', async () => {
      const { result } = renderHook(() => useCryptoPrices())

      if (mockWebSocket.onopen) {
        mockWebSocket.onopen()
      }

      // Marca bitcoin como inválido
      for (let i = 0; i < 3; i++) {
        const message = new MessageEvent('message', {
          data: JSON.stringify({ bitcoin: null })
        })

        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(message)
        }
      }

      // Marca ethereum como inválido
      for (let i = 0; i < 3; i++) {
        const message = new MessageEvent('message', {
          data: JSON.stringify({ ethereum: null })
        })

        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(message)
        }
      }

      await waitFor(() => {
        expect(result.current.invalidAssets).toContain('bitcoin')
        expect(result.current.invalidAssets).toContain('ethereum')
        expect(result.current.invalidAssets.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('should not add duplicate invalid assets', async () => {
      const { result } = renderHook(() => useCryptoPrices())

      if (mockWebSocket.onopen) {
        mockWebSocket.onopen()
      }

      // Simula 6 mensagens com null (deveria marcar como inválido após 3 e não duplicar)
      for (let i = 0; i < 6; i++) {
        const message = new MessageEvent('message', {
          data: JSON.stringify({ bitcoin: null })
        })

        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(message)
        }
      }

      await waitFor(() => {
        const bitcoinCount = result.current.invalidAssets.filter(id => id === 'bitcoin').length
        expect(bitcoinCount).toBeLessThanOrEqual(1)
      })
    })

    it('should not mark asset as invalid if receiving less than 3 consecutive errors', async () => {
      const { result } = renderHook(() => useCryptoPrices())

      if (mockWebSocket.onopen) {
        mockWebSocket.onopen()
      }

      // Apenas 2 mensagens com null
      for (let i = 0; i < 2; i++) {
        const message = new MessageEvent('message', {
          data: JSON.stringify({ cardano: null })
        })

        if (mockWebSocket.onmessage) {
          mockWebSocket.onmessage(message)
        }
      }

      await waitFor(() => {
        expect(result.current.invalidAssets).not.toContain('cardano')
      })
    })
  })
})
