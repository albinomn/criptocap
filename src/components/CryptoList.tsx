import { useState, useEffect, useMemo } from "react";
import { formatPrice, formatNumber } from "../utils/formatters";
import { cryptoData } from "../data/mockCryptoData";
import { useCryptoPrices } from "../hooks/useCryptoPrices";
import { cryptoCache } from "../services/cryptoCache";
import AddCryptoModal from "./AddCryptoModal";
import type { Crypto } from "../types/crypto";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PriceHistory {
  timestamp: number;
  price: number;
  formattedTime: string;
}

export default function CryptoList() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>(
    {}
  );
  const [customCryptos, setCustomCryptos] = useState<Crypto[]>([]);
  const [hiddenCryptos, setHiddenCryptos] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState<
    Record<string, PriceHistory[]>
  >({});

  // Extrai os IDs das criptos customizadas para o WebSocket
  const customAssetIds = customCryptos.map((crypto) => crypto.id);
  const { prices, error, invalidAssets } = useCryptoPrices(customAssetIds);

  // Remove automaticamente assets inválidos detectados pelo WebSocket
  useEffect(() => {
    if (invalidAssets.length > 0) {
      invalidAssets.forEach(async (assetId) => {
        console.log(`Removing invalid asset: ${assetId}`);

        // Verifica se é custom ou default
        const isCustom = customCryptos.some((c) => c.id === assetId);

        try {
          // Remove do cache
          await cryptoCache.deletePrice(assetId);

          if (isCustom) {
            // Remove custom crypto
            await cryptoCache.deleteCustomCrypto(assetId);
            setCustomCryptos((prev) => prev.filter((c) => c.id !== assetId));
          } else {
            // Esconde default crypto
            setHiddenCryptos((prev) => new Set(prev).add(assetId));
          }

          // Limpa histórico
          setPriceHistory((prev) => {
            const updated = { ...prev };
            delete updated[assetId];
            return updated;
          });
        } catch (err) {
          console.error(`Error removing invalid asset ${assetId}:`, err);
        }
      });
    }
  }, [invalidAssets, customCryptos]);

  // Carrega criptos customizadas e últimos preços do cache ao montar
  useEffect(() => {
    const loadCustomCryptos = async () => {
      try {
        await cryptoCache.init();
        const savedCryptos = await cryptoCache.getAllCustomCryptos();
        if (savedCryptos.length > 0) {
          setCustomCryptos(savedCryptos);
        }

        // Carrega últimos 10 preços do cache
        const cachedPrices = await cryptoCache.getAllPrices();
        if (cachedPrices.length > 0) {
          const historyFromCache: Record<string, PriceHistory[]> = {};

          cachedPrices.forEach((cached) => {
            const formattedTime = new Date(cached.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            if (!historyFromCache[cached.id]) {
              historyFromCache[cached.id] = [];
            }

            historyFromCache[cached.id].push({
              timestamp: cached.timestamp,
              price: cached.price,
              formattedTime,
            });
          });

          // Mantém apenas os últimos 10 de cada
          Object.keys(historyFromCache).forEach((id) => {
            historyFromCache[id] = historyFromCache[id]
              .sort((a, b) => a.timestamp - b.timestamp)
              .slice(-10);
          });

          setPriceHistory(historyFromCache);
        }
      } catch (err) {
        console.error("Error loading custom cryptos:", err);
      }
    };

    loadCustomCryptos();
  }, []);

  // Combina cryptos padrão com customizadas
  const allCryptos = useMemo(() => {
    return [...cryptoData, ...customCryptos];
  }, [customCryptos]);

  // Atualiza os preços anteriores para cálculo de variação
  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      const newPreviousPrices: Record<string, number> = {};
      allCryptos.forEach((crypto) => {
        if (prices[crypto.id] && !previousPrices[crypto.id]) {
          newPreviousPrices[crypto.id] = parseFloat(prices[crypto.id]);
        }
      });
      if (Object.keys(newPreviousPrices).length > 0) {
        setPreviousPrices((prev) => ({ ...prev, ...newPreviousPrices }));
      }
    }
  }, [prices, previousPrices, allCryptos]);

  // Armazena histórico de preços (últimos 10 valores) - somente quando houver mudança
  useEffect(() => {
    if (Object.keys(prices).length > 0) {
      const now = Date.now();
      const formattedTime = new Date(now).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      setPriceHistory((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        Object.entries(prices).forEach(([cryptoId, priceStr]) => {
          const price = parseFloat(priceStr);
          const history = prev[cryptoId] || [];

          // Só adiciona se o preço mudou ou se não há histórico
          const lastPrice = history.length > 0 ? history[history.length - 1].price : null;

          if (lastPrice === null || price !== lastPrice) {
            // Adiciona novo ponto de preço
            const newHistory: PriceHistory[] = [
              ...history,
              { timestamp: now, price, formattedTime },
            ];

            // Mantém apenas os últimos 10 valores
            updated[cryptoId] = newHistory.slice(-10);
            hasChanges = true;
          }
        });

        // Só retorna novo objeto se houve mudanças
        return hasChanges ? updated : prev;
      });
    }
  }, [prices]);

  // Mescla os dados mockados com os preços em tempo real e filtra os ocultos
  const updatedCryptoData = useMemo(() => {
    return allCryptos
      .filter((crypto) => !hiddenCryptos.has(crypto.id))
      .map((crypto): Crypto => {
      // Prioridade: 1) Preço em tempo real do WebSocket, 2) Último preço do histórico (cache), 3) Preço mockado
      const realtimePrice = prices[crypto.id]
        ? parseFloat(prices[crypto.id])
        : null;

      // Busca o último preço do histórico se não houver preço em tempo real
      const lastHistoryPrice = !realtimePrice && priceHistory[crypto.id]?.length > 0
        ? priceHistory[crypto.id][priceHistory[crypto.id].length - 1].price
        : null;

      const currentPrice = realtimePrice || lastHistoryPrice;
      const previousPrice = previousPrices[crypto.id];

      if (currentPrice) {
        // Calcula a variação percentual baseada no preço anterior
        const change24h = previousPrice
          ? ((currentPrice - previousPrice) / previousPrice) * 100
          : crypto.change24h;

        return {
          ...crypto,
          price: currentPrice,
          change24h,
        };
      }

      return crypto;
    });
  }, [prices, previousPrices, allCryptos, hiddenCryptos, priceHistory]);

  const handleAddCrypto = async (
    newCrypto: Omit<Crypto, "price" | "change24h">
  ) => {
    const crypto: Crypto = {
      ...newCrypto,
      price: 0,
      change24h: 0,
    };

    try {
      // Salva no IndexedDB
      await cryptoCache.saveCustomCrypto(crypto);
      // Atualiza o estado local
      setCustomCryptos((prev) => [...prev, crypto]);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error saving custom crypto:", err);
      // Ainda adiciona localmente mesmo se falhar o salvamento
      setCustomCryptos((prev) => [...prev, crypto]);
      setIsModalOpen(false);
    }
  };

  const handleDeleteCrypto = async (cryptoId: string) => {
    // Check if it's a custom crypto
    const isCustom = customCryptos.some((c) => c.id === cryptoId);

    try {
      // Delete price data from IndexedDB for all cryptos
      await cryptoCache.deletePrice(cryptoId);

      if (isCustom) {
        // Remove custom crypto from IndexedDB
        await cryptoCache.deleteCustomCrypto(cryptoId);
        // Update local state
        setCustomCryptos((prev) => prev.filter((c) => c.id !== cryptoId));
      } else {
        // For default cryptos, hide them from display
        setHiddenCryptos((prev) => new Set(prev).add(cryptoId));
      }

      // Close expanded area if it was open
      if (expandedId === cryptoId) {
        setExpandedId(null);
      }

      // Clear price history for this crypto
      setPriceHistory((prev) => {
        const updated = { ...prev };
        delete updated[cryptoId];
        return updated;
      });
    } catch (err) {
      console.error("Error deleting crypto:", err);
      // Remove/hide locally even if cache deletion fails
      if (isCustom) {
        setCustomCryptos((prev) => prev.filter((c) => c.id !== cryptoId));
      } else {
        setHiddenCryptos((prev) => new Set(prev).add(cryptoId));
      }
      if (expandedId === cryptoId) {
        setExpandedId(null);
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-3 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
            Criptomoedas
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
          {/* Header da tabela */}
          <div className="hidden md:grid md:grid-cols-[minmax(3rem,auto)_auto_1fr_auto_auto_auto] gap-2 lg:gap-4 px-3 sm:px-6 py-4 bg-gray-900/50 border-b border-gray-700 text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">
            <div>#</div>
            <div>Ticker</div>
            <div>Nome</div>
            <div className="text-right">Preço</div>
            <div className="text-right">24h</div>
            <div className="text-center">Ações</div>
          </div>

          {/* Cards */}
          <div className="divide-y divide-gray-700">
            {updatedCryptoData.map((crypto) => (
              <div key={crypto.id} className="transition-all duration-200">
                {/* Card principal */}
                <div className="relative group">
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(3rem,auto)_auto_1fr_auto_auto_auto] gap-2 lg:gap-4 px-3 sm:px-6 py-4 hover:bg-gray-700/30 transition-colors duration-200">
                    <div
                      onClick={() => toggleExpand(crypto.id)}
                      className="md:contents cursor-pointer"
                    >
                  {/* Mobile Layout */}
                  <div className="md:hidden flex items-center gap-2">
                    <div className="text-gray-400 font-semibold text-sm min-w-[2rem]">
                      #{crypto.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm truncate">
                        {crypto.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {crypto.symbol}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white text-sm whitespace-nowrap">
                        {formatPrice(crypto.price)}
                      </div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          crypto.change24h >= 0
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {crypto.change24h >= 0 ? "+" : ""}
                        {crypto.change24h.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Deseja realmente remover ${crypto.name}?`)) {
                            handleDeleteCrypto(crypto.id);
                          }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Remover criptomoeda"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden md:contents">
                    <div className="flex items-center text-gray-400 font-semibold text-sm lg:text-base">
                      {crypto.rank}
                    </div>

                    <div className="flex items-center text-gray-300 font-medium text-sm lg:text-base">
                      {crypto.symbol}
                    </div>

                    <div className="flex items-center min-w-0">
                      <div className="font-semibold text-white text-sm lg:text-base truncate">
                        {crypto.name}
                      </div>
                    </div>

                    <div className="flex items-center justify-end text-white font-semibold text-sm lg:text-base">
                      {formatPrice(crypto.price)}
                    </div>

                    <div className="flex items-center justify-end">
                      <span
                        className={`px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm font-semibold whitespace-nowrap ${
                          crypto.change24h >= 0
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {crypto.change24h >= 0 ? "+" : ""}
                        {crypto.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Delete button column */}
                  <div className="hidden md:flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Deseja realmente remover ${crypto.name}?`)) {
                          handleDeleteCrypto(crypto.id);
                        }
                      }}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Remover criptomoeda"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Área expansível */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  expandedId === crypto.id ? "max-h-[1000px]" : "max-h-0"
                }`}
              >
                  <div className="px-6 py-6 bg-gray-900/30 border-t border-gray-700/50">
                    <div className="space-y-6">
                      {/* Gráfico e Tabela lado a lado */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Gráfico */}
                        <div className="h-full">
                          {priceHistory[crypto.id] &&
                          priceHistory[crypto.id].length > 1 ? (
                            <>
                              <h3 className="text-lg font-semibold text-white mb-3">
                                Histórico de Preços
                              </h3>
                              <div className="bg-gray-800/50 rounded-lg p-4 h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={priceHistory[crypto.id]}>
                                    <CartesianGrid
                                      strokeDasharray="3 3"
                                      stroke="#374151"
                                    />
                                    <XAxis
                                      dataKey="formattedTime"
                                      stroke="#9CA3AF"
                                      tick={{ fontSize: 12 }}
                                      angle={-45}
                                      textAnchor="end"
                                      height={60}
                                    />
                                    <YAxis
                                      stroke="#9CA3AF"
                                      tick={{ fontSize: 12 }}
                                      domain={["auto", "auto"]}
                                      tickFormatter={(value) =>
                                        `$${value.toFixed(2)}`
                                      }
                                    />
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: "#1F2937",
                                        border: "1px solid #374151",
                                        borderRadius: "8px",
                                      }}
                                      labelStyle={{ color: "#F3F4F6" }}
                                      itemStyle={{ color: "#60A5FA" }}
                                      formatter={(value: number) => [
                                        `$${value.toFixed(6)}`,
                                        "Preço",
                                      ]}
                                    />
                                    <Line
                                      type="monotone"
                                      dataKey="price"
                                      stroke="#60A5FA"
                                      strokeWidth={2}
                                      dot={{ fill: "#60A5FA", r: 3 }}
                                      activeDot={{ r: 5 }}
                                    />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                            </>
                          ) : (
                            <div className="bg-gray-800/50 rounded-lg p-6 text-center h-[280px] flex flex-col items-center justify-center">
                              <p className="text-gray-400">
                                Aguardando atualizações de preço...
                              </p>
                              <p className="text-gray-500 text-sm mt-2">
                                O histórico será exibido assim que os dados
                                chegarem via WebSocket
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Tabela de histórico */}
                        <div className="h-full">
                          {priceHistory[crypto.id] &&
                          priceHistory[crypto.id].length > 0 ? (
                            <>
                              <h3 className="text-lg font-semibold text-white mb-3">
                                Últimas Atualizações
                              </h3>
                              <div className="bg-gray-800/50 rounded-lg overflow-hidden h-[280px] flex flex-col">
                                <table className="w-full">
                                  <thead className="bg-gray-900/80 sticky top-0 z-10">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                                        Horário
                                      </th>
                                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase">
                                        Preço
                                      </th>
                                    </tr>
                                  </thead>
                                </table>
                                <div className="overflow-y-auto flex-1">
                                  <table className="w-full">
                                    <tbody className="divide-y divide-gray-700">
                                      {[...priceHistory[crypto.id]]
                                        .reverse()
                                        .map((entry) => (
                                          <tr
                                            key={entry.timestamp}
                                            className="hover:bg-gray-700/30"
                                          >
                                            <td className="px-4 py-2 text-sm text-gray-300">
                                              {entry.formattedTime}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-white font-semibold text-right">
                                              {formatPrice(entry.price)}
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="bg-gray-800/50 rounded-lg p-6 text-center h-[280px] flex flex-col items-center justify-center">
                              <p className="text-gray-400">
                                Aguardando atualizações de preço...
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Detalhes embaixo */}
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-3">
                          Detalhes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                            <span className="text-gray-400">
                              Supply em Circulação
                            </span>
                            <span className="text-white font-semibold">
                              {formatNumber(crypto.supply)} {crypto.symbol}
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                            <span className="text-gray-400">Ranking</span>
                            <span className="text-white font-semibold">
                              #{crypto.rank}
                            </span>
                          </div>

                          <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                            <span className="text-gray-400">Variação 24h</span>
                            <span
                              className={`font-semibold ${
                                crypto.change24h >= 0
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {crypto.change24h >= 0 ? "+" : ""}
                              {crypto.change24h.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>

        {/* Botão flutuante para adicionar cripto */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all duration-200 transform hover:scale-110 z-40"
          aria-label="Adicionar criptomoeda"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        {/* Modal para adicionar cripto */}
        <AddCryptoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddCrypto}
          existingRanks={updatedCryptoData.map((c) => c.rank)}
        />
      </div>
    </div>
  );
}
