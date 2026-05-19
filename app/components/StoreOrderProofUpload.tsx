'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type StoreOrderProofUploadProps = {
  code: string
  proofUrl: string | null
  paymentMethod: string | null
}

export function StoreOrderProofUpload({
  code,
  proofUrl,
  paymentMethod,
}: StoreOrderProofUploadProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  if (paymentMethod === 'efectivo') {
    return null
  }

  async function handleSubmit() {
    if (!file || submitting) {
      return
    }

    setSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const formData = new FormData()
      formData.set('proof', file)

      const response = await fetch(`/api/account/orders/${encodeURIComponent(code)}/proof`, {
        method: 'POST',
        body: formData,
      })

      const result = (await response.json()) as { ok?: boolean; error?: string }

      if (!response.ok || !result.ok) {
        setErrorMessage(result.error || 'No se pudo subir el comprobante.')
        return
      }

      setSuccessMessage('Comprobante cargado correctamente.')
      setFile(null)
      router.refresh()
    } catch {
      setErrorMessage('No se pudo subir el comprobante.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <article className="rounded-[30px] border border-[#0071e3]/10 bg-white p-7 shadow-[0_12px_32px_rgba(0,0,0,0.05)]">
      <p className="text-[0.86rem] font-semibold uppercase tracking-[0.22em] text-[#86868b]">
        Comprobante
      </p>
      <h2 className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-[#1d1d1f]">
        Sube tu comprobante de pago
      </h2>
      <p className="mt-3 text-[0.96rem] leading-7 text-[#424245]">
        Adjunta una imagen o PDF para que el equipo valide tu pago más rápido.
      </p>

      {proofUrl ? (
        <a
          href={proofUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex min-h-[2.9rem] items-center justify-center rounded-full border border-[#0071e3]/10 bg-[#fbfcff] px-4 text-[0.92rem] font-medium text-[#1d1d1f] transition hover:bg-white"
        >
          Ver comprobante actual
        </a>
      ) : null}

      <div className="mt-5">
        <label className="block">
          <span className="text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
            Archivo
          </span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            className="mt-2 block w-full rounded-[18px] border border-[#0071e3]/10 bg-white px-4 py-3 text-[0.94rem] text-[#1d1d1f]"
          />
        </label>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-[20px] bg-[#fff1f0] px-4 py-3 text-[0.92rem] text-[#9f2d20]">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-4 rounded-[20px] bg-[#effbf3] px-4 py-3 text-[0.92rem] text-[#237a3c]">
          {successMessage}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!file || submitting}
        className="mt-6 inline-flex min-h-[3rem] items-center justify-center rounded-full bg-[#0071e3] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Subiendo...' : proofUrl ? 'Reemplazar comprobante' : 'Subir comprobante'}
      </button>
    </article>
  )
}
