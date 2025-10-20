export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD'
  }).format(price)
}

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(num)
}
