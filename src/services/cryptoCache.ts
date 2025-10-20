import type { Crypto } from '../types/crypto'

interface CachedPrice {
  id: string
  price: number
  timestamp: number
}

const DB_NAME = 'CryptoCacheDB'
const PRICE_STORE_NAME = 'prices'
const CRYPTO_STORE_NAME = 'customCryptos'
const DB_VERSION = 2

class CryptoCacheService {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Cria o object store de preços se não existir
        if (!db.objectStoreNames.contains(PRICE_STORE_NAME)) {
          const objectStore = db.createObjectStore(PRICE_STORE_NAME, { keyPath: 'id' })
          objectStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Cria o object store de criptos customizadas se não existir
        if (!db.objectStoreNames.contains(CRYPTO_STORE_NAME)) {
          db.createObjectStore(CRYPTO_STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }

  async savePrice(id: string, price: number): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([PRICE_STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(PRICE_STORE_NAME)

      const data: CachedPrice = {
        id,
        price,
        timestamp: Date.now()
      }

      const request = objectStore.put(data)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getPrice(id: string): Promise<CachedPrice | null> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([PRICE_STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(PRICE_STORE_NAME)
      const request = objectStore.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async getAllPrices(): Promise<CachedPrice[]> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([PRICE_STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(PRICE_STORE_NAME)
      const request = objectStore.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  async clearOldPrices(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([PRICE_STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(PRICE_STORE_NAME)
      const index = objectStore.index('timestamp')
      const cutoffTime = Date.now() - maxAgeMs

      const request = index.openCursor()

      request.onerror = () => reject(request.error)

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result

        if (cursor) {
          if (cursor.value.timestamp < cutoffTime) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
    })
  }

  async saveCustomCrypto(crypto: Crypto): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([CRYPTO_STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(CRYPTO_STORE_NAME)
      const request = objectStore.put(crypto)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getAllCustomCryptos(): Promise<Crypto[]> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([CRYPTO_STORE_NAME], 'readonly')
      const objectStore = transaction.objectStore(CRYPTO_STORE_NAME)
      const request = objectStore.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }

  async deleteCustomCrypto(id: string): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([CRYPTO_STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(CRYPTO_STORE_NAME)
      const request = objectStore.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async deletePrice(id: string): Promise<void> {
    if (!this.db) {
      await this.init()
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([PRICE_STORE_NAME], 'readwrite')
      const objectStore = transaction.objectStore(PRICE_STORE_NAME)
      const request = objectStore.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}

export const cryptoCache = new CryptoCacheService()
