import type { Crypto } from '../types/crypto'

export const cryptoData: Crypto[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 67234.50,
    change24h: 2.45,
    marketCap: 1316789234567,
    volume24h: 34567890123,
    description: 'Bitcoin é a primeira criptomoeda descentralizada do mundo.',
    supply: 19500000,
    rank: 1
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 3456.78,
    change24h: -1.23,
    marketCap: 415678901234,
    volume24h: 12345678901,
    description: 'Ethereum é uma plataforma blockchain com contratos inteligentes.',
    supply: 120000000,
    rank: 2
  },
  {
    id: 'binancecoin',
    name: 'Binance Coin',
    symbol: 'BNB',
    price: 589.23,
    change24h: 3.67,
    marketCap: 87654321098,
    volume24h: 2345678901,
    description: 'BNB é o token nativo da Binance exchange.',
    supply: 148000000,
    rank: 3
  },
  {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    price: 0.56,
    change24h: 5.12,
    marketCap: 19876543210,
    volume24h: 987654321,
    description: 'Cardano é uma blockchain de terceira geração baseada em pesquisa científica.',
    supply: 35000000000,
    rank: 4
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    price: 142.89,
    change24h: -2.34,
    marketCap: 65432109876,
    volume24h: 1876543210,
    description: 'Solana é uma blockchain de alta performance para aplicações descentralizadas.',
    supply: 450000000,
    rank: 5
  }
]
