# Integração WebSocket - Preços em Tempo Real

Este documento descreve a implementação da integração com WebSocket para atualização de preços de criptomoedas em tempo real.

## Visão Geral

A aplicação agora conecta-se ao endpoint WebSocket da CoinCap API para receber atualizações de preços em tempo real das seguintes criptomoedas:

- Bitcoin (BTC)
- Ethereum (ETH)
- Binance Coin (BNB)
- Cardano (ADA)
- Solana (SOL)

## Arquitetura

### Hook Customizado: `useCryptoPrices`

Localização: [src/hooks/useCryptoPrices.ts](src/hooks/useCryptoPrices.ts)

**Responsabilidades:**
- Gerenciar conexão WebSocket com a API da CoinCap
- Receber e processar atualizações de preços em tempo real
- Normalizar IDs da API para IDs internos (ex: `binance-coin` → `binancecoin`)
- Manter estado de conexão e erros
- Reconexão automática em caso de desconexão (a cada 3 segundos)

**Retorno:**
```typescript
{
  prices: { [cryptoId: string]: string },  // Preços atualizados (com IDs normalizados)
  isConnected: boolean,                     // Estado da conexão
  error: string | null                      // Mensagens de erro
}
```

**Endpoint WebSocket:**
```
wss://ws.coincap.io/prices?assets=bitcoin,ethereum,binance-coin,cardano,solana
```

**Mapeamento de IDs:**
A API CoinCap usa `binance-coin` (com hífen), mas internamente usamos `binancecoin` (sem hífen) para consistência. O hook faz essa normalização automaticamente.

### Componente: `CryptoList`

O componente foi atualizado para:

1. **Integrar dados em tempo real**: Usa o hook `useCryptoPrices()` para receber atualizações
2. **Mesclar dados**: Combina dados mockados (marketCap, volume, descrição) com preços em tempo real
3. **Calcular variações**: Calcula variação percentual baseada no preço anterior
4. **Indicador de conexão**: Exibe status da conexão no topo da página
5. **Tratamento de erros**: Mostra mensagem de erro quando houver problemas na conexão

## Fluxo de Dados

```
WebSocket API (CoinCap)
         ↓
   useCryptoPrices()
         ↓
    { prices, isConnected, error }
         ↓
    CryptoList Component
         ↓
   updatedCryptoData (merged)
         ↓
     UI Rendering
```

## Recursos Implementados

### 1. Indicador de Conexão em Tempo Real

- **Bolinha verde pulsante**: Conectado e recebendo dados
- **Bolinha vermelha**: Desconectado
- **Texto**: "Tempo Real" ou "Desconectado"

### 2. Atualização Automática de Preços

Os preços são atualizados instantaneamente quando recebidos via WebSocket, sem necessidade de refresh da página.

### 3. Cálculo de Variação Percentual

A variação é calculada comparando o preço atual com o preço anterior:
```typescript
change24h = ((currentPrice - previousPrice) / previousPrice) * 100
```

### 4. Reconexão Automática

Se a conexão cair, o hook tenta reconectar automaticamente após 3 segundos.

### 5. Tratamento de Erros

Mensagens de erro são exibidas em um banner vermelho no topo da lista quando:
- Falha na criação da conexão WebSocket
- Erro durante a conexão ativa
- Problemas ao parsear mensagens recebidas

## Alterações nos Dados

### IDs Atualizados

Os IDs das criptomoedas foram alterados para corresponder aos IDs da API CoinCap:

| Anterior | Novo          | Crypto        |
|----------|---------------|---------------|
| '1'      | 'bitcoin'     | Bitcoin       |
| '2'      | 'ethereum'    | Ethereum      |
| '3'      | 'binancecoin' | Binance Coin  |
| '4'      | 'cardano'     | Cardano       |
| '5'      | 'solana'      | Solana        |

## Testes

### Testes do Hook WebSocket

Localização: [src/hooks/useCryptoPrices.test.ts](src/hooks/useCryptoPrices.test.ts)

**8 testes implementados:**
- Inicialização com estado vazio
- Conexão ao WebSocket com endpoint correto (`binance-coin`)
- Mudança de estado ao conectar
- Atualização de preços ao receber mensagens
- Tratamento de erros
- Cleanup ao desmontar
- Acumulação de preços de múltiplas mensagens
- **Normalização de IDs**: `binance-coin` → `binancecoin`

### Testes Atualizados

- `mockCryptoData.test.ts`: Atualizados para verificar novos IDs
- `CryptoList.test.tsx`: Continuam funcionando com a integração WebSocket (mock automático em ambiente de teste)

**Total de testes: 62 (todos passando ✅)**

## Uso

### Desenvolvimento

```bash
npm run dev
```

A aplicação conectará automaticamente ao WebSocket ao iniciar e começará a receber atualizações de preços.

### Testes

```bash
# Rodar todos os testes
npm run test:run

# Testes em modo watch
npm run test

# Testes com UI
npm run test:ui
```

## Limitações e Considerações

1. **Dados Complementares**: MarketCap, volume24h e outros dados permanecem mockados. Apenas o preço é atualizado em tempo real.

2. **Variação 24h**: A variação é calculada desde o primeiro preço recebido na sessão atual, não é a variação real de 24h da API.

3. **Reconexão**: A reconexão automática ocorre a cada 3 segundos após uma desconexão.

4. **Browser Support**: Requer suporte a WebSocket (todos os navegadores modernos).

## Próximos Passos Sugeridos

1. Integrar REST API da CoinCap para buscar dados complementares (marketCap, volume, etc.)
2. Persistir preços anteriores em localStorage para calcular variações reais
3. Adicionar gráficos de histórico de preços
4. Implementar notificações de mudanças bruscas de preço
5. Adicionar mais criptomoedas à lista
