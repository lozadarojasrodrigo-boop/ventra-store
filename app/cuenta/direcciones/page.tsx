import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SavedAddressesManager } from '@/app/components/SavedAddressesManager'
import { StoreFooter } from '@/app/components/StoreFooter'
import { StoreHeader } from '@/app/components/StoreHeader'
import { getAddressesForUser } from '@/lib/store/customer'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function AccountAddressesPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar')
  }

  const addresses = await getAddressesForUser(user.id)

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader
        utilitySlot={
          <Link
            href="/cuenta"
            className="inline-flex min-h-[2.7rem] items-center justify-center rounded-full px-4 text-[0.92rem] font-medium text-[#1d1d1f] transition hover:bg-black/4"
          >
            Volver a mi cuenta
          </Link>
        }
      />

      <section className="store-shell py-6">
        <SavedAddressesManager initialAddresses={addresses} />
      </section>

      <StoreFooter />
    </main>
  )
}
