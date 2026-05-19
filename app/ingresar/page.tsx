import Link from 'next/link'

import { StoreAuthPanel } from '@/app/components/StoreAuthPanel'
import { StoreFooter } from '@/app/components/StoreFooter'
import { StoreHeader } from '@/app/components/StoreHeader'

export default function StoreAuthPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f]">
      <StoreHeader
        utilitySlot={
          <Link
            href="/"
            className="inline-flex min-h-[2.7rem] items-center justify-center rounded-full px-4 text-[0.92rem] font-medium text-[#1d1d1f] transition hover:bg-black/4"
          >
            Volver a la tienda
          </Link>
        }
      />

      <section className="store-shell py-6">
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <article className="store-panel rounded-[30px] p-7">
            <p className="text-[0.86rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
              Cuenta VENTRA
            </p>
            <h1 className="mt-3 text-[2.45rem] font-semibold tracking-[-0.05em] text-[#1d1d1f] md:text-[4.2rem]">
              Sigue tus pedidos en un solo lugar
            </h1>
            <div className="mt-6 space-y-3">
              <Benefit title="Ver el estado real" text="Consulta si tu pedido está en revisión, confirmado, preparando, enviado o entregado." />
              <Benefit title="Historial de compras" text="Mantén todos tus pedidos web reunidos dentro de tu cuenta." />
              <Benefit title="Continuidad más rápida" text="Haz futuras compras con una experiencia más directa y ordenada." />
            </div>
          </article>

          <StoreAuthPanel />
        </div>
      </section>

      <StoreFooter />
    </main>
  )
}

function Benefit({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[22px] border border-[#0071e3]/10 bg-[#fbfcff] px-5 py-4">
      <p className="text-[1rem] font-semibold text-[#1d1d1f]">{title}</p>
      <p className="mt-1 text-[0.94rem] leading-7 text-[#424245]">{text}</p>
    </div>
  )
}
