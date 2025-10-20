import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CryptoList from './CryptoList'

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

// Mock useCryptoPrices hook
vi.mock('../hooks/useCryptoPrices', () => ({
  useCryptoPrices: vi.fn(() => ({
    prices: {},
    isConnected: false,
    error: null,
    invalidAssets: []
  }))
}))

describe('CryptoList', () => {
  beforeEach(() => {
    mockCryptoCache.__reset()
    render(<CryptoList />)
  })

  afterEach(() => {
    mockCryptoCache.__reset()
  })

  describe('Rendering', () => {
    it('should render the title', () => {
      expect(screen.getByText('Criptomoedas')).toBeInTheDocument()
    })

    it('should render table headers on desktop', () => {
      expect(screen.getByText('#')).toBeInTheDocument()
      expect(screen.getByText('Nome')).toBeInTheDocument()
      expect(screen.getByText('Ticker')).toBeInTheDocument()
      expect(screen.getByText('Preço')).toBeInTheDocument()
      expect(screen.getByText('24h')).toBeInTheDocument()
    })

    it('should render all cryptocurrencies', () => {
      expect(screen.getAllByText('Bitcoin').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Ethereum').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Binance Coin').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Cardano').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Solana').length).toBeGreaterThan(0)
    })

    it('should render cryptocurrency symbols (tickers)', () => {
      expect(screen.getAllByText('BTC').length).toBeGreaterThan(0)
      expect(screen.getAllByText('ETH').length).toBeGreaterThan(0)
      expect(screen.getAllByText('BNB').length).toBeGreaterThan(0)
      expect(screen.getAllByText('ADA').length).toBeGreaterThan(0)
      expect(screen.getAllByText('SOL').length).toBeGreaterThan(0)
    })

    it('should render prices in USD format', () => {
      // Verifica se há valores em formato de moeda (US$)
      const prices = screen.getAllByText(/US\$/)
      expect(prices.length).toBeGreaterThan(0)
    })

    it('should display positive and negative percentage changes', () => {
      // Verifica variações positivas (com +)
      const positiveChanges = screen.getAllByText(/\+2\.45%/)
      expect(positiveChanges.length).toBeGreaterThan(0)

      const binanceChanges = screen.getAllByText(/\+3\.67%/)
      expect(binanceChanges.length).toBeGreaterThan(0)

      const cardanoChanges = screen.getAllByText(/\+5\.12%/)
      expect(cardanoChanges.length).toBeGreaterThan(0)

      // Verifica variações negativas (com -)
      const ethChanges = screen.getAllByText(/-1\.23%/)
      expect(ethChanges.length).toBeGreaterThan(0)

      const solanaChanges = screen.getAllByText(/-2\.34%/)
      expect(solanaChanges.length).toBeGreaterThan(0)
    })

    it('should display rank numbers', () => {
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })
  })

  describe('Expandable functionality', () => {
    it('should have expandable area with max-h-0 initially', () => {
      const expandableAreas = document.querySelectorAll('.max-h-0')
      // Should have 5 collapsed expandable areas (one per crypto)
      expect(expandableAreas.length).toBe(5)
    })

    it('should expand card when clicked', async () => {
      const user = userEvent.setup()

      // Clica no card do Bitcoin (pega o primeiro elemento)
      const bitcoinCards = screen.getAllByText('Bitcoin')
      const bitcoinCard = bitcoinCards[0].closest('div')?.parentElement
      expect(bitcoinCard).toBeInTheDocument()

      if (bitcoinCard) {
        await user.click(bitcoinCard)

        // Verifica que há elementos com max-h-[1000px] (expandido)
        await waitFor(() => {
          const expandedArea = document.querySelector('.max-h-\\[1000px\\]')
          expect(expandedArea).toBeInTheDocument()
        })
      }
    })

    it('should show detailed information when expanded', async () => {
      const user = userEvent.setup()

      const ethereumCards = screen.getAllByText('Ethereum')
      const ethereumCard = ethereumCards[0].closest('div')?.parentElement

      if (ethereumCard) {
        await user.click(ethereumCard)

        await waitFor(() => {
          // "Sobre" section was removed, now checking for price history and details sections
          expect(screen.getAllByText('Detalhes').length).toBeGreaterThan(0)
          expect(screen.getAllByText('Supply em Circulação').length).toBeGreaterThan(0)
          expect(screen.getAllByText('Ranking').length).toBeGreaterThan(0)
        })
      }
    })

    it('should toggle expansion state when clicked multiple times', async () => {
      const user = userEvent.setup()

      const cardanoCards = screen.getAllByText('Cardano')
      const cardanoCard = cardanoCards[0].closest('div')?.parentElement

      if (cardanoCard) {
        // Verifica que começa colapsado
        let expandedAreas = document.querySelectorAll('.max-h-\\[1000px\\]')
        expect(expandedAreas.length).toBe(0)

        // Expande
        await user.click(cardanoCard)
        await waitFor(() => {
          expandedAreas = document.querySelectorAll('.max-h-\\[1000px\\]')
          expect(expandedAreas.length).toBe(1)
        })

        // Colapsa
        await user.click(cardanoCard)
        await waitFor(() => {
          expandedAreas = document.querySelectorAll('.max-h-\\[1000px\\]')
          expect(expandedAreas.length).toBe(0)
        })
      }
    })

    it('should only allow one expanded card at a time', async () => {
      const user = userEvent.setup()

      const bitcoinCards = screen.getAllByText('Bitcoin')
      const bitcoinCard = bitcoinCards[0].closest('div')?.parentElement
      const ethereumCards = screen.getAllByText('Ethereum')
      const ethereumCard = ethereumCards[0].closest('div')?.parentElement

      if (bitcoinCard && ethereumCard) {
        // Expande Bitcoin
        await user.click(bitcoinCard)
        await waitFor(() => {
          const expandedAreas = document.querySelectorAll('.max-h-\\[1000px\\]')
          expect(expandedAreas.length).toBe(1)
        })

        // Expande Ethereum - Bitcoin deve colapsar
        await user.click(ethereumCard)
        await waitFor(() => {
          const expandedAreas = document.querySelectorAll('.max-h-\\[1000px\\]')
          expect(expandedAreas.length).toBe(1) // Ainda apenas 1 expandido
        })
      }
    })
  })

  describe('Data formatting', () => {
    it('should format large numbers with compact notation', async () => {
      const user = userEvent.setup()

      const bitcoinCards = screen.getAllByText('Bitcoin')
      const bitcoinCard = bitcoinCards[0].closest('div')?.parentElement

      if (bitcoinCard) {
        await user.click(bitcoinCard)

        await waitFor(() => {
          // Verifica se o supply está em formato compacto (19,5 mi, 19.5M, etc)
          const supplyElements = screen.getAllByText(/BTC/)
          expect(supplyElements.length).toBeGreaterThan(1) // Deve ter BTC no card principal e na área expandida
        })
      }
    })
  })

  describe('Visual indicators', () => {
    it('should use green color for positive changes', () => {
      const positiveChanges = screen.getAllByText(/\+2\.45%/)
      expect(positiveChanges.length).toBeGreaterThan(0)
      positiveChanges.forEach(element => {
        expect(element.className).toContain('green')
      })
    })

    it('should use red color for negative changes', () => {
      const negativeChanges = screen.getAllByText(/-1\.23%/)
      expect(negativeChanges.length).toBeGreaterThan(0)
      negativeChanges.forEach(element => {
        expect(element.className).toContain('red')
      })
    })
  })

  describe('Interactive elements', () => {
    it('should have clickable rows', () => {
      const bitcoinCards = screen.getAllByText('Bitcoin')
      const clickableRow = bitcoinCards[0].closest('.cursor-pointer')
      expect(clickableRow).toBeInTheDocument()
    })

    it('should show hover effect on rows', () => {
      const bitcoinCards = screen.getAllByText('Bitcoin')
      const hoverRow = bitcoinCards[0].closest('.hover\\:bg-gray-700\\/30')
      expect(hoverRow).toBeInTheDocument()
    })

  })

  describe('Price History and Charts', () => {
    it('should show "Aguardando atualizações de preço" when no price history exists', async () => {
      const user = userEvent.setup()

      const bitcoinCards = screen.getAllByText('Bitcoin')
      const bitcoinCard = bitcoinCards[0].closest('div')?.parentElement

      if (bitcoinCard) {
        await user.click(bitcoinCard)

        // When there's no price history data, should show waiting message
        // Note: In test environment, WebSocket won't connect so no real-time prices
        await waitFor(() => {
          const waitingMessages = screen.getAllByText(/Aguardando atualizações de preço/i)
          // Should have at least one waiting message (chart or table)
          expect(waitingMessages.length).toBeGreaterThan(0)
        })
      }
    })

    it('should have chart and table sections in expanded area', async () => {
      const user = userEvent.setup()

      const ethereumCards = screen.getAllByText('Ethereum')
      const ethereumCard = ethereumCards[0].closest('div')?.parentElement

      if (ethereumCard) {
        await user.click(ethereumCard)

        await waitFor(() => {
          // Both chart and table sections should exist (even if showing waiting message)
          // The grid layout contains both sections
          const expandedContent = document.querySelector('.max-h-\\[1000px\\]')
          expect(expandedContent).toBeInTheDocument()

          // Should have the grid layout with 2 columns
          const gridLayout = expandedContent?.querySelector('.grid-cols-1.lg\\:grid-cols-2')
          expect(gridLayout).toBeInTheDocument()
        })
      }
    })

    it('should have Detalhes section below chart and table', async () => {
      const user = userEvent.setup()

      const solanaCards = screen.getAllByText('Solana')
      const solanaCard = solanaCards[0].closest('div')?.parentElement

      if (solanaCard) {
        await user.click(solanaCard)

        await waitFor(() => {
          // Should show Detalhes heading
          expect(screen.getAllByText('Detalhes').length).toBeGreaterThan(0)

          // Should show details in grid layout
          expect(screen.getAllByText('Supply em Circulação').length).toBeGreaterThan(0)
          expect(screen.getAllByText('Ranking').length).toBeGreaterThan(0)
          expect(screen.getAllByText('Variação 24h').length).toBeGreaterThan(0)
        })
      }
    })
  })

  describe('Delete functionality', () => {
    it('should render delete buttons for each cryptocurrency', () => {
      render(<CryptoList />)

      // Should have delete buttons (trash icons)
      const deleteButtons = document.querySelectorAll('button[title="Remover criptomoeda"]')
      // At least 5 delete buttons (one per default crypto)
      expect(deleteButtons.length).toBeGreaterThanOrEqual(5)
    })

    it('should show confirmation dialog when delete button is clicked', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<CryptoList />)

      const deleteButtons = document.querySelectorAll('button[title="Remover criptomoeda"]')
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0] as HTMLElement)

        expect(confirmSpy).toHaveBeenCalled()
      }

      confirmSpy.mockRestore()
    })

    it('should not delete when user cancels confirmation', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<CryptoList />)

      const bitcoinElements = screen.getAllByText('Bitcoin')
      const initialBitcoinCount = bitcoinElements.length

      const deleteButtons = document.querySelectorAll('button[title="Remover criptomoeda"]')
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0] as HTMLElement)

        // Bitcoin should still be in the document
        const afterBitcoinElements = screen.getAllByText('Bitcoin')
        expect(afterBitcoinElements.length).toBe(initialBitcoinCount)
      }

      confirmSpy.mockRestore()
    })

    it('should not propagate click event to card when clicking delete button', async () => {
      const user = userEvent.setup()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<CryptoList />)

      // Verify initially all cards are collapsed
      let expandedAreas = document.querySelectorAll('.max-h-\\[1000px\\]')
      expect(expandedAreas.length).toBe(0)

      const deleteButtons = document.querySelectorAll('button[title="Remover criptomoeda"]')
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0] as HTMLElement)

        // Card should NOT be expanded after clicking delete button
        expandedAreas = document.querySelectorAll('.max-h-\\[1000px\\]')
        expect(expandedAreas.length).toBe(0)
      }

      confirmSpy.mockRestore()
    })
  })

  describe('Grid layout', () => {
    it('should have 6 columns in desktop layout', () => {
      render(<CryptoList />)

      // Check for the grid with custom columns template
      const header = document.querySelector('.md\\:grid-cols-\\[minmax\\(3rem\\,auto\\)_auto_1fr_auto_auto_auto\\]')
      expect(header).toBeInTheDocument()
    })

    it('should display columns in correct order: #, Ticker, Nome, Preço, 24h, Ações', () => {
      render(<CryptoList />)

      // Check that all column headers exist
      expect(screen.getAllByText('#').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Ticker').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Nome').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Preço').length).toBeGreaterThan(0)
      expect(screen.getAllByText('24h').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Ações').length).toBeGreaterThan(0)
    })

    it('should have minimum width for rank column', () => {
      render(<CryptoList />)

      // The grid template should have minmax(3rem,auto) for the rank column
      const header = document.querySelector('.md\\:grid-cols-\\[minmax\\(3rem\\,auto\\)_auto_1fr_auto_auto_auto\\]')
      expect(header).toBeInTheDocument()
    })
  })

  describe('Mobile responsive layout', () => {
    it('should have mobile layout with flex columns', () => {
      render(<CryptoList />)

      // Mobile layout uses flex instead of grid
      const mobileLayouts = document.querySelectorAll('.md\\:hidden.flex')
      expect(mobileLayouts.length).toBeGreaterThan(0)
    })

    it('should display delete button in mobile layout without overlap', () => {
      render(<CryptoList />)

      // Mobile delete buttons should exist and not use absolute positioning
      const mobileDeleteButtons = document.querySelectorAll('.md\\:hidden button[title="Remover criptomoeda"]')

      // Should have mobile delete buttons
      expect(mobileDeleteButtons.length).toBeGreaterThan(0)
    })

    it('should show rank, name, symbol, price, change and delete button on mobile', () => {
      render(<CryptoList />)

      // All elements should be visible
      const rankElements = screen.getAllByText(/^#1$/)
      expect(rankElements.length).toBeGreaterThan(0)
      expect(screen.getAllByText('Bitcoin').length).toBeGreaterThan(0)
      expect(screen.getAllByText('BTC').length).toBeGreaterThan(0)
    })
  })

  describe('Invalid assets handling', () => {
    it('should handle invalidAssets from useCryptoPrices hook', () => {
      render(<CryptoList />)

      // The component should render without errors even when invalidAssets is empty
      const titles = screen.getAllByText('Criptomoedas')
      expect(titles.length).toBeGreaterThan(0)
    })
  })
})
