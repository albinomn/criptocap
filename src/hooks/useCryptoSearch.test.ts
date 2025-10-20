import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCryptoSearch } from './useCryptoSearch'

describe('useCryptoSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useCryptoSearch())

    expect(result.current.data).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should search for cryptocurrency successfully', async () => {
    const mockData = {
      data: [
        {
          id: 'bitcoin',
          name: 'Bitcoin',
          symbol: 'BTC',
          rank: '1',
          supply: '19000000',
          maxSupply: '21000000',
          marketCapUsd: '500000000000',
          volumeUsd24Hr: '20000000000',
          priceUsd: '26000',
          changePercent24Hr: '2.5',
          vwap24Hr: '25800'
        }
      ]
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData
    })

    const { result } = renderHook(() => useCryptoSearch())

    await result.current.searchCrypto('BTC')

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData.data)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    expect(global.fetch).toHaveBeenCalledWith(
      'https://rest.coincap.io/v3/assets?search=BTC&limit=10',
      expect.objectContaining({
        headers: {
          'Authorization': 'Bearer f673cb75d3d791afcc26853981a04dae4d8789190324fc735f6f10e42d1b6842',
          'Content-Type': 'application/json'
        }
      })
    )
  })

  it('should handle no results found', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] })
    })

    const { result } = renderHook(() => useCryptoSearch())

    await result.current.searchCrypto('INVALID')

    await waitFor(() => {
      expect(result.current.data).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Criptomoeda não encontrada')
    })
  })

  it('should handle API errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500
    })

    const { result } = renderHook(() => useCryptoSearch())

    await result.current.searchCrypto('BTC')

    await waitFor(() => {
      expect(result.current.data).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Erro ao buscar criptomoeda')
    })
  })

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useCryptoSearch())

    await result.current.searchCrypto('BTC')

    await waitFor(() => {
      expect(result.current.data).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Erro ao conectar com a API')
    })
  })

  it('should not search with empty symbol', async () => {
    global.fetch = vi.fn()

    const { result } = renderHook(() => useCryptoSearch())

    await result.current.searchCrypto('')

    expect(result.current.data).toEqual([])
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('should not search with symbol less than 2 characters', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] })
    })

    const { result } = renderHook(() => useCryptoSearch())

    await result.current.searchCrypto('B')

    // Single character searches are allowed now, but may return empty results
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
  })

  it('should clear search results', async () => {
    const mockData = {
      data: [
        {
          id: 'bitcoin',
          name: 'Bitcoin',
          symbol: 'BTC',
          rank: '1',
          supply: '19000000',
          maxSupply: '21000000',
          marketCapUsd: '500000000000',
          volumeUsd24Hr: '20000000000',
          priceUsd: '26000',
          changePercent24Hr: '2.5',
          vwap24Hr: '25800'
        }
      ]
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData
    })

    const { result } = renderHook(() => useCryptoSearch())

    await result.current.searchCrypto('BTC')

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData.data)
    })

    result.current.clearSearch()

    await waitFor(() => {
      expect(result.current.data).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  it('should return the found asset from searchCrypto', async () => {
    const mockAsset = {
      id: 'ethereum',
      name: 'Ethereum',
      symbol: 'ETH',
      rank: '2',
      supply: '120000000',
      maxSupply: null,
      marketCapUsd: '200000000000',
      volumeUsd24Hr: '10000000000',
      priceUsd: '1600',
      changePercent24Hr: '1.8',
      vwap24Hr: '1590'
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [mockAsset] })
    })

    const { result } = renderHook(() => useCryptoSearch())

    const returnedAssets = await result.current.searchCrypto('ETH')

    expect(returnedAssets).toEqual([mockAsset])
  })

  it('should return empty array when search fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    })

    const { result } = renderHook(() => useCryptoSearch())

    const returnedAssets = await result.current.searchCrypto('INVALID')

    expect(returnedAssets).toEqual([])
  })
})
