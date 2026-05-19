import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/admin'
import type { StoreProduct } from '@/lib/store/products'

export type StoreCustomerAddress = {
  id: number
  etiqueta: string
  destinatario: string
  telefono: string
  ciudad: string
  direccion: string
  referencia: string
  is_default: boolean
}

export type StoreNotificationPreferences = {
  email_order_received: boolean
  email_payment_review: boolean
  email_payment_confirmed: boolean
  email_order_sent: boolean
  email_order_delivered: boolean
}

export type StoreProductReview = {
  id: number
  nombre_mostrado: string
  rating: number
  comentario: string
  created_at: string | null
}

export async function getFavoriteProductIdsForUser(userId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('store_customer_favorites')
    .select('product_id')
    .eq('auth_user_id', userId)

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((item) => Number(item.product_id))
}

export async function getFavoriteProductsForUser(userId: string) {
  const supabase = getSupabaseAdmin()
  const favoriteIds = await getFavoriteProductIdsForUser(userId)
  if (favoriteIds.length === 0) {
    return [] as StoreProduct[]
  }

  const { data, error } = await supabase
    .from('productos')
    .select('id,nombre,categoria,caracteristicas,estado_publicacion,sku,precio_venta,stock_actual,imagen_url,activo')
    .in('id', favoriteIds)
    .neq('activo', false)

  if (error) {
    throw new Error(error.message)
  }

  const products = ((data || []) as StoreProduct[]).sort(
    (a, b) => favoriteIds.indexOf(a.id) - favoriteIds.indexOf(b.id)
  )

  return products
}

export async function getAddressesForUser(userId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('store_customer_addresses')
    .select('id,etiqueta,destinatario,telefono,ciudad,direccion,referencia,is_default')
    .eq('auth_user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as StoreCustomerAddress[]
}

export async function getDefaultAddressForUser(userId: string) {
  const addresses = await getAddressesForUser(userId)
  return addresses.find((address) => address.is_default) || addresses[0] || null
}

export async function getNotificationPreferencesForUser(userId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('store_customer_notification_preferences')
    .select(
      'email_order_received,email_payment_review,email_payment_confirmed,email_order_sent,email_order_delivered'
    )
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data || {
    email_order_received: true,
    email_payment_review: true,
    email_payment_confirmed: true,
    email_order_sent: true,
    email_order_delivered: true,
  }) as StoreNotificationPreferences
}

export async function getReviewsForProduct(productId: number) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('store_product_reviews')
    .select('id,nombre_mostrado,rating,comentario,created_at')
    .eq('product_id', productId)
    .eq('status', 'publicado')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as StoreProductReview[]
}

export function buildPersonalRecommendations(products: StoreProduct[], favorites: StoreProduct[]) {
  if (favorites.length === 0) {
    return products.slice(0, 4)
  }

  const favoriteCategories = new Set(
    favorites.map((product) => (product.categoria || '').trim()).filter(Boolean)
  )

  return products
    .filter((product) => !favorites.some((favorite) => favorite.id === product.id))
    .sort((a, b) => {
      const aMatch = favoriteCategories.has((a.categoria || '').trim()) ? 1 : 0
      const bMatch = favoriteCategories.has((b.categoria || '').trim()) ? 1 : 0
      return bMatch - aMatch || b.id - a.id
    })
    .slice(0, 4)
}
