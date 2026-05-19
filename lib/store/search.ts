import type { StoreProduct } from '@/lib/store/products'

function normalizeText(value: string | null | undefined) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function scoreStoreProduct(product: StoreProduct, query: string) {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) {
    return 0
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
  const name = normalizeText(product.nombre)
  const sku = normalizeText(product.sku)
  const category = normalizeText(product.categoria)
  const haystack = [name, sku, category].filter(Boolean).join(' ')

  let score = 0

  if (name === normalizedQuery) score += 240
  if (sku === normalizedQuery) score += 220
  if (category === normalizedQuery) score += 180

  if (name.startsWith(normalizedQuery)) score += 150
  if (sku.startsWith(normalizedQuery)) score += 140
  if (category.startsWith(normalizedQuery)) score += 110

  if (name.includes(normalizedQuery)) score += 100
  if (sku.includes(normalizedQuery)) score += 90
  if (category.includes(normalizedQuery)) score += 70

  for (const token of tokens) {
    if (name.includes(token)) score += 35
    if (sku.includes(token)) score += 25
    if (category.includes(token)) score += 18
  }

  if (haystack.replace(/\s+/g, '').includes(normalizedQuery.replace(/\s+/g, ''))) {
    score += 20
  }

  return score
}

export function searchStoreProducts(products: StoreProduct[], query: string) {
  return products
    .map((product) => ({
      product,
      score: scoreStoreProduct(product, query),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.product.id - a.product.id)
    .map((entry) => entry.product)
}
