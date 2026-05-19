import Link from 'next/link'

import { StoreFooter } from '@/app/components/StoreFooter'
import { StoreHeader } from '@/app/components/StoreHeader'
import { StoreResetPasswordPanel } from '@/app/components/StoreResetPasswordPanel'

export default function StoreResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader
        utilitySlot={
          <Link
            href="/ingresar"
            className="inline-flex min-h-[2.7rem] items-center justify-center rounded-full px-4 text-[0.92rem] font-medium text-[#1d1d1f] transition hover:bg-black/4"
          >
            Volver a ingresar
          </Link>
        }
      />

      <section className="store-shell py-6">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="store-panel rounded-[30px] p-7">
            <p className="text-[0.86rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
              Seguridad
            </p>
            <h1 className="mt-3 text-[2.45rem] font-semibold tracking-[-0.05em] text-[#1d1d1f] md:text-[4.2rem]">
              Actualiza tu contraseña
            </h1>
            <p className="mt-4 max-w-[36rem] text-[0.98rem] leading-8 text-[#424245]">
              Define una nueva contraseña para seguir revisando tus pedidos desde la cuenta VENTRA.
            </p>
          </article>

          <StoreResetPasswordPanel />
        </div>
      </section>

      <StoreFooter />
    </main>
  )
}
