import Link from 'next/link'
import { redirect } from 'next/navigation'

import { NotificationPreferencesForm } from '@/app/components/NotificationPreferencesForm'
import { StoreEditProfileForm } from '@/app/components/StoreEditProfileForm'
import { StoreFooter } from '@/app/components/StoreFooter'
import { StoreHeader } from '@/app/components/StoreHeader'
import { getNotificationPreferencesForUser } from '@/lib/store/customer'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServerClient } from '@/lib/supabase/server'

type CustomerProfile = {
  nombre: string | null
  apellido: string | null
  celular: string | null
  ciudad: string | null
  correo: string | null
}

async function getProfileForUser(userId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('store_customer_profiles')
    .select('nombre,apellido,celular,ciudad,correo')
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return (data || null) as CustomerProfile | null
}

export default async function EditProfilePage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/ingresar')
  }

  const profile = await getProfileForUser(user.id)
  const notificationPreferences = await getNotificationPreferencesForUser(user.id)

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
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="store-panel rounded-[30px] p-7">
            <p className="text-[0.86rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
              Perfil
            </p>
            <h1 className="mt-3 text-[2.45rem] font-semibold tracking-[-0.05em] text-[#1d1d1f] md:text-[4.2rem]">
              Edita tus datos
            </h1>
          </article>

          <StoreEditProfileForm
            initialProfile={{
              nombre: (profile?.nombre || '').trim(),
              apellido: (profile?.apellido || '').trim(),
              celular: (profile?.celular || '').trim(),
              ciudad: (profile?.ciudad || '').trim(),
              correo: (profile?.correo || user.email || '').trim(),
            }}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
          <article className="store-panel rounded-[30px] p-7">
            <p className="text-[0.82rem] font-semibold uppercase tracking-[0.2em] text-[#86868b]">
              Accesos
            </p>
            <div className="mt-5 grid gap-3">
              <Link href="/cuenta/direcciones" className="rounded-[20px] border border-[#0071e3]/10 bg-[#fbfcff] px-4 py-4 text-[0.96rem] font-semibold text-[#1d1d1f]">
                Direcciones guardadas
              </Link>
              <Link href="/cuenta/favoritos" className="rounded-[20px] border border-[#0071e3]/10 bg-[#fbfcff] px-4 py-4 text-[0.96rem] font-semibold text-[#1d1d1f]">
                Favoritos
              </Link>
            </div>
          </article>

          <NotificationPreferencesForm initialPreferences={notificationPreferences} />
        </div>
      </section>

      <StoreFooter />
    </main>
  )
}
