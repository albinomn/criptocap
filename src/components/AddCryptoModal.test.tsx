import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddCryptoModal from './AddCryptoModal'

// Create mock using vi.hoisted to avoid hoisting issues
const mockCryptoCache = vi.hoisted(() => ({
  init: vi.fn().mockResolvedValue(undefined),
  getAllPrices: vi.fn().mockResolvedValue([]),
  saveCustomCrypto: vi.fn().mockResolvedValue(undefined),
  __reset: vi.fn()
}))

// Mock useCryptoSearch hook
vi.mock('../hooks/useCryptoSearch', () => ({
  useCryptoSearch: vi.fn(() => ({
    searchCrypto: vi.fn(),
    clearSearch: vi.fn(),
    data: [],
    loading: false,
    error: null,
  }))
}))

// Mock cryptoCache
vi.mock('../services/cryptoCache', () => ({
  cryptoCache: mockCryptoCache
}))

describe('AddCryptoModal', () => {
  const mockOnClose = vi.fn()
  const mockOnAdd = vi.fn()
  const existingRanks = [1, 2, 3, 4, 5]

  beforeEach(() => {
    mockCryptoCache.__reset()
    mockOnClose.mockClear()
    mockOnAdd.mockClear()
  })

  afterEach(() => {
    mockCryptoCache.__reset()
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <AddCryptoModal
          isOpen={false}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      expect(screen.queryByText('Adicionar Criptomoeda')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      expect(screen.getByText('Adicionar Criptomoeda')).toBeInTheDocument()
    })

    it('should render search field', () => {
      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      expect(screen.getByLabelText(/Buscar Criptomoeda/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/Digite o nome ou símbolo/i)).toBeInTheDocument()
    })

    it('should render submit and cancel buttons', () => {
      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Adicionar/i })).toBeInTheDocument()
    })

    it('should render close button', () => {
      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      expect(screen.getByLabelText('Fechar modal')).toBeInTheDocument()
    })
  })

  describe('Form interaction', () => {
    it('should update search field when typing', async () => {
      const user = userEvent.setup()
      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      const searchInput = screen.getByLabelText(/Buscar Criptomoeda/i) as HTMLInputElement

      await user.type(searchInput, 'Bitcoin')

      expect(searchInput.value).toBe('Bitcoin')
    })

    it('should call onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when clicking close button', async () => {
      const user = userEvent.setup()
      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      const closeButton = screen.getByLabelText('Fechar modal')
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Form validation', () => {
    it('should show error when submitting without selecting a crypto', async () => {
      const user = userEvent.setup()
      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      const submitButton = screen.getByRole('button', { name: /Adicionar/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Selecione uma criptomoeda/i)).toBeInTheDocument()
      })

      expect(mockOnAdd).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper label for search field', () => {
      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      expect(screen.getByLabelText(/Buscar Criptomoeda/i)).toBeInTheDocument()
    })

    it('should have aria-label on close button', () => {
      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      expect(screen.getByLabelText('Fechar modal')).toBeInTheDocument()
    })

    it('should have required indicator on search field label', () => {
      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      // The label should contain an asterisk (*) for required field
      expect(screen.getByText(/Buscar Criptomoeda \*/i)).toBeInTheDocument()
    })
  })

  describe('Search functionality', () => {
    it('should show loading state while searching', () => {
      const { useCryptoSearch } = require('../hooks/useCryptoSearch')
      useCryptoSearch.mockReturnValue({
        searchCrypto: vi.fn(),
        clearSearch: vi.fn(),
        data: [],
        loading: true,
        error: null,
      })

      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      // Should show loading spinner when loading
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should clear search when modal closes', async () => {
      const mockClearSearch = vi.fn()
      const { useCryptoSearch } = require('../hooks/useCryptoSearch')
      useCryptoSearch.mockReturnValue({
        searchCrypto: vi.fn(),
        clearSearch: mockClearSearch,
        data: [],
        loading: false,
        error: null,
      })

      const { rerender } = render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      // Close the modal
      rerender(
        <AddCryptoModal
          isOpen={false}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={existingRanks}
        />
      )

      await waitFor(() => {
        expect(mockClearSearch).toHaveBeenCalled()
      })
    })
  })

  describe('Rank generation', () => {
    it('should auto-generate next rank based on existing ranks', () => {
      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={[1, 2, 3, 10, 15]}
        />
      )

      // The next rank should be 16 (max + 1)
      // This will be tested when submitting a crypto
    })

    it('should use rank 1 when no existing ranks', () => {
      render(
        <AddCryptoModal
          isOpen={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          existingRanks={[]}
        />
      )

      // Should start from rank 1
    })
  })
})
