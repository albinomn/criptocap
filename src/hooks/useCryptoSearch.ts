import { useState, useCallback } from "react";

const API_TOKEN =
  "f673cb75d3d791afcc26853981a04dae4d8789190324fc735f6f10e42d1b6842";

export interface CoinCapAsset {
  id: string;
  name: string;
  symbol: string;
  rank: string;
  supply: string;
  maxSupply: string | null;
  marketCapUsd: string;
  volumeUsd24Hr: string;
  priceUsd: string;
  changePercent24Hr: string;
  vwap24Hr: string;
}

interface SearchResult {
  data: CoinCapAsset[];
  loading: boolean;
  error: string | null;
}

export function useCryptoSearch() {
  const [result, setResult] = useState<SearchResult>({
    data: [],
    loading: false,
    error: null,
  });

  const searchCrypto = useCallback(
    async (symbol: string, limit: number = 10): Promise<CoinCapAsset[]> => {
      console.log('useCryptoSearch: searching for', symbol, 'limit:', limit);

      if (!symbol || symbol.length < 1) {
        setResult({ data: [], loading: false, error: null });
        return [];
      }

      setResult({ data: [], loading: true, error: null });

      try {
        const url = `https://rest.coincap.io/v3/assets?search=${symbol}&limit=${limit}`;
        console.log('useCryptoSearch: fetching', url);

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
            "Content-Type": "application/json",
          },
        });

        console.log('useCryptoSearch: response status', response.status);

        if (!response.ok) {
          const errorMessage = "Erro ao buscar criptomoeda";
          console.error('useCryptoSearch: API error', response.status);
          setResult({ data: [], loading: false, error: errorMessage });
          return [];
        }

        const data = await response.json();
        const assets: CoinCapAsset[] = data.data;

        console.log('useCryptoSearch: found', assets?.length || 0, 'results');

        // Verifica se encontrou algum resultado
        if (!assets || assets.length === 0) {
          const errorMessage = "Criptomoeda não encontrada";
          setResult({ data: [], loading: false, error: errorMessage });
          return [];
        }

        setResult({ data: assets, loading: false, error: null });
        return assets;
      } catch (err) {
        console.error("useCryptoSearch: Error fetching crypto:", err);
        const errorMessage = "Erro ao conectar com a API";
        setResult({ data: [], loading: false, error: errorMessage });
        return [];
      }
    },
    []
  );

  const clearSearch = useCallback(() => {
    setResult({ data: [], loading: false, error: null });
  }, []);

  return {
    searchCrypto,
    clearSearch,
    data: result.data,
    loading: result.loading,
    error: result.error,
  };
}
