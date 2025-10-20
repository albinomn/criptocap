import { useState, useEffect, useRef } from "react";
import type { Crypto } from "../types/crypto";
import { useCryptoSearch, type CoinCapAsset } from "../hooks/useCryptoSearch";

interface AddCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (crypto: Omit<Crypto, "price" | "change24h">) => void;
  existingRanks: number[];
}

export default function AddCryptoModal({
  isOpen,
  onClose,
  onAdd,
  existingRanks,
}: AddCryptoModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState<CoinCapAsset | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const debounceTimerRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { searchCrypto, data, loading, error, clearSearch } = useCryptoSearch();

  // Effect para debounce na busca
  useEffect(() => {
    // Limpa o timer anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Se o termo de busca estiver vazio, não busca
    if (!searchTerm || searchTerm.length < 1) {
      clearSearch();
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);

    // Cria um novo timer com delay de 300ms
    debounceTimerRef.current = window.setTimeout(() => {
      searchCrypto(searchTerm, 20);
    }, 300);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, searchCrypto, clearSearch]);

  // Limpa o formulário quando o modal fecha
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setSelectedCrypto(null);
      setShowDropdown(false);
      setErrors({});
      clearSearch();
    }
  }, [isOpen, clearSearch]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCrypto = (crypto: CoinCapAsset) => {
    setSelectedCrypto(crypto);
    setSearchTerm(`${crypto.symbol} - ${crypto.name}`);
    setShowDropdown(false);
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    const newErrors: Record<string, string> = {};

    if (!selectedCrypto) {
      newErrors.crypto = "Selecione uma criptomoeda";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Calcula o próximo rank disponível
    const nextRank = Math.max(...existingRanks, 0) + 1;

    // Usa o ID do asset como ID
    const newCrypto: Omit<Crypto, "price" | "change24h"> = {
      id: selectedCrypto!.id,
      name: selectedCrypto!.name,
      symbol: selectedCrypto!.symbol,
      marketCap: parseFloat(selectedCrypto!.marketCapUsd) || 0,
      volume24h: parseFloat(selectedCrypto!.volumeUsd24Hr) || 0,
      description: `Criptomoeda ${selectedCrypto!.name}`,
      supply: parseFloat(selectedCrypto!.supply) || 0,
      rank: nextRank,
    };

    onAdd(newCrypto);

    // Limpa o formulário
    setSearchTerm("");
    setSelectedCrypto(null);
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Search term:', value);
    setSearchTerm(value);
    setSelectedCrypto(null);
    if (errors.crypto) {
      setErrors({});
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 max-w-2xl w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              Adicionar Criptomoeda
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Fechar modal"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div ref={dropdownRef} className="relative">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Buscar Criptomoeda *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  name="search"
                  value={searchTerm}
                  onChange={handleInputChange}
                  onFocus={() => searchTerm && setShowDropdown(true)}
                  placeholder="Digite o nome ou símbolo..."
                  autoComplete="off"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Dropdown com resultados */}
              {showDropdown && (data.length > 0 || loading || error) && (
                <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {loading && (
                    <div className="px-4 py-8 text-center text-gray-400">
                      Buscando criptomoedas...
                    </div>
                  )}

                  {error && !loading && (
                    <div className="px-4 py-8 text-center text-yellow-400">
                      {error}
                    </div>
                  )}

                  {!loading && !error && data.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-400">
                      Nenhuma criptomoeda encontrada
                    </div>
                  )}

                  {!loading && data.length > 0 && (
                    <ul className="py-1">
                      {data.map((crypto) => (
                        <li key={crypto.id}>
                          <button
                            type="button"
                            onClick={() => handleSelectCrypto(crypto)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-600 transition-colors flex items-center justify-between group"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-white text-lg">
                                  {crypto.symbol}
                                </span>
                                <span className="text-gray-300">
                                  {crypto.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm">
                                <span className="text-gray-400">
                                  Rank #{crypto.rank}
                                </span>
                                <span className="text-green-400">
                                  ${parseFloat(crypto.priceUsd).toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </span>
                                <span className="text-gray-400">
                                  Cap: ${(parseFloat(crypto.marketCapUsd) / 1e9).toFixed(2)}B
                                </span>
                              </div>
                            </div>
                            <svg
                              className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {errors.crypto && (
                <p className="mt-2 text-sm text-red-400">{errors.crypto}</p>
              )}

              {!showDropdown && selectedCrypto && (
                <div className="mt-3 p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <p className="text-sm text-gray-400 mb-2">Criptomoeda selecionada:</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold text-lg">
                        {selectedCrypto.symbol} - {selectedCrypto.name}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span className="text-gray-400">Rank #{selectedCrypto.rank}</span>
                        <span className="text-green-400">
                          ${parseFloat(selectedCrypto.priceUsd).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCrypto(null);
                        setSearchTerm("");
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!selectedCrypto}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Adicionar Cripto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
