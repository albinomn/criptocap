import { useState, useEffect, useRef } from "react";
import { cryptoCache } from "../services/cryptoCache";
import { API_TOKEN } from "../utils/environment";

interface PriceUpdate {
  [key: string]: string;
}

interface UseCryptoPricesResult {
  prices: PriceUpdate;
  isConnected: boolean;
  error: string | null;
  invalidAssets: string[];
}

// Mapeamento entre IDs da API CoinCap e IDs internos
const ASSET_ID_MAP: Record<string, string> = {
  "binance-coin": "binancecoin",
};

export function useCryptoPrices(
  customAssetIds: string[] = []
): UseCryptoPricesResult {
  const defaultAssetIds = [
    "bitcoin",
    "ethereum",
    "binance-coin",
    "cardano",
    "solana",
  ];
  const allAssetIds = [...defaultAssetIds, ...customAssetIds];
  const WS_URL = `wss://ws.coincap.io/prices?assets=${allAssetIds.join(
    ","
  )}&apiKey=${API_TOKEN}`;
  const [prices, setPrices] = useState<PriceUpdate>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidAssets, setInvalidAssets] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const errorCountRef = useRef<Record<string, number>>({});

  // Carrega preços do cache ao montar
  useEffect(() => {
    const loadCachedPrices = async () => {
      try {
        await cryptoCache.init();
        const cachedPrices = await cryptoCache.getAllPrices();

        if (cachedPrices.length > 0) {
          const priceMap: PriceUpdate = {};
          cachedPrices.forEach((cached) => {
            priceMap[cached.id] = cached.price.toString();
          });
          setPrices(priceMap);
        }
      } catch (err) {
        console.error("Error loading cached prices:", err);
      }
    };

    loadCachedPrices();
  }, []);

  useEffect(() => {
    const connect = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as PriceUpdate;

            // Normaliza os IDs da API para IDs internos
            const normalizedData: PriceUpdate = {};
            const invalidAssetsList: string[] = [];

            Object.keys(data).forEach((key) => {
              const normalizedKey = ASSET_ID_MAP[key] || key;
              const value = data[key];

              // Verifica se o valor é válido
              if (
                value === null ||
                value === undefined ||
                value === "null" ||
                value === "undefined"
              ) {
                // Incrementa contador de erros para este asset
                errorCountRef.current[normalizedKey] =
                  (errorCountRef.current[normalizedKey] || 0) + 1;

                // Se errou 3 vezes seguidas, marca como inválido
                if (errorCountRef.current[normalizedKey] >= 3) {
                  console.warn(
                    `Asset ${normalizedKey} marked as invalid after 3 consecutive errors`
                  );
                  invalidAssetsList.push(normalizedKey);
                }
                return;
              }

              // Reseta contador de erros se recebeu valor válido
              errorCountRef.current[normalizedKey] = 0;

              normalizedData[normalizedKey] = value;

              // Salva no cache
              const price = parseFloat(value);
              if (!isNaN(price)) {
                cryptoCache.savePrice(normalizedKey, price).catch((err) => {
                  console.error("Error saving to cache:", err);
                });
              }
            });

            if (invalidAssetsList.length > 0) {
              setInvalidAssets((prev) => [
                ...new Set([...prev, ...invalidAssetsList]),
              ]);
            }

            setPrices((prevPrices) => ({
              ...prevPrices,
              ...normalizedData,
            }));
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        ws.onerror = (event) => {
          console.error("WebSocket error:", event);
          setError("Erro na conexão WebSocket");
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected");
          setIsConnected(false);

          // Tentar reconectar após 3 segundos
          reconnectTimeoutRef.current = window.setTimeout(() => {
            console.log("Attempting to reconnect...");
            connect();
          }, 3000);
        };
      } catch (err) {
        console.error("Error creating WebSocket:", err);
        setError("Erro ao criar conexão WebSocket");
      }
    };

    connect();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [WS_URL]);

  return { prices, isConnected, error, invalidAssets };
}
