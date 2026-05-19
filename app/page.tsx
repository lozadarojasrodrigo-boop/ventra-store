import { StorefrontHomeClient } from '@/app/components/StorefrontHomeClient'
import { getStoreProducts } from '@/lib/store/products'

export default async function Home() {
  const products = await getStoreProducts()
  return <StorefrontHomeClient products={products} />
}
