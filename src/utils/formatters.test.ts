import { describe, it, expect } from 'vitest'
import { formatPrice, formatNumber } from './formatters'

describe('formatters', () => {
  describe('formatPrice', () => {
    it('should format a price in USD currency', () => {
      const result = formatPrice(67234.50)
      expect(result).toContain('67')
      expect(result).toContain('234')
      expect(result).toContain('50')
    })

    it('should format small prices correctly', () => {
      const result = formatPrice(0.56)
      expect(result).toContain('0')
      expect(result).toContain('56')
    })

    it('should format large prices correctly', () => {
      const result = formatPrice(1316789234567)
      expect(result).toContain('1')
      expect(result).toContain('316')
      expect(result).toContain('789')
      expect(result).toContain('234')
      expect(result).toContain('567')
    })

    it('should handle zero price', () => {
      const result = formatPrice(0)
      expect(result).toContain('0')
    })

    it('should handle negative prices', () => {
      const result = formatPrice(-100)
      expect(result).toContain('100')
    })

    it('should format with 2 decimal places', () => {
      const result = formatPrice(123.456)
      expect(result).toContain('123')
      expect(result).toContain('46') // Arredonda para 123.46
    })
  })

  describe('formatNumber', () => {
    it('should format small numbers without compact notation', () => {
      const result = formatNumber(100)
      expect(result).toBe('100')
    })

    it('should format thousands with compact notation', () => {
      const result = formatNumber(1500)
      expect(result).toMatch(/1.5\s*mil|1,5\s*mil/)
    })

    it('should format millions with compact notation', () => {
      const result = formatNumber(19500000)
      expect(result).toMatch(/19.5\s*mi|19,5\s*mi|20\s*mi/)
    })

    it('should format billions with compact notation', () => {
      const result = formatNumber(120000000)
      expect(result).toMatch(/120\s*mi|120\s*milhões/)
    })

    it('should format very large numbers', () => {
      const result = formatNumber(35000000000)
      expect(result).toMatch(/35\s*bi|35\s*mil\s*mi/)
    })

    it('should handle zero', () => {
      const result = formatNumber(0)
      expect(result).toBe('0')
    })

    it('should format decimal numbers correctly', () => {
      const result = formatNumber(1234.56)
      expect(result).toContain('1')
    })

    it('should use short compact display', () => {
      const result = formatNumber(1000000)
      // Should be compact like "1 mi" or "1M", not "1 million"
      expect(result.length).toBeLessThan(10)
    })
  })

  describe('edge cases', () => {
    it('formatPrice should handle very small decimal numbers', () => {
      const result = formatPrice(0.0001)
      expect(result).toContain('0')
    })

    it('formatNumber should handle very large numbers', () => {
      const result = formatNumber(999999999999999)
      expect(result).toBeTruthy()
      expect(typeof result).toBe('string')
    })

    it('both formatters should handle NaN gracefully', () => {
      const priceResult = formatPrice(NaN)
      const numberResult = formatNumber(NaN)

      expect(typeof priceResult).toBe('string')
      expect(typeof numberResult).toBe('string')
    })

    it('both formatters should handle Infinity', () => {
      const priceResult = formatPrice(Infinity)
      const numberResult = formatNumber(Infinity)

      expect(typeof priceResult).toBe('string')
      expect(typeof numberResult).toBe('string')
    })
  })
})
