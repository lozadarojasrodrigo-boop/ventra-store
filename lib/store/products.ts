import 'server-only'

import { getSupabaseAdmin } from '@/lib/supabase/admin'

export type StoreProduct = {
  id: number
  nombre: string | null
  categoria: string | null
  caracteristicas: string | null
  estado_publicacion: 'disponible' | 'agotado' | 'proximamente' | null
  sku: string | null
  precio_venta: number | null
  stock_actual: number | null
  imagen_url: string | null
  activo: boolean | null
}

export async function getStoreProducts() {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('productos')
    .select('id,nombre,categoria,caracteristicas,estado_publicacion,sku,precio_venta,stock_actual,imagen_url,activo')
    .neq('activo', false)
    .order('id', { ascending: false })

  return (data || []) as StoreProduct[]
}

export async function getStoreProductById(productId: number) {
  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('productos')
    .select('id,nombre,categoria,caracteristicas,estado_publicacion,sku,precio_venta,stock_actual,imagen_url,activo')
    .eq('id', productId)
    .neq('activo', false)
    .maybeSingle()

  const product = data as StoreProduct | null
  if (!product) {
    return null
  }

  return product
}
