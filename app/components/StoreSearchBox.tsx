'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { StoreProduct } from '@/lib/store/products'
import { searchStoreProducts } from '@/lib/store/search'

const money = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

type StoreSearchBoxProps = {
  products: StoreProduct[]
  initialQuery?: string
}

export function StoreSearchBox({ products, initialQuery = '' }: StoreSearchBoxProps) {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState(initialQuery)
  const [open, setOpen] = useState(false)

  const normalized = query.trim()

  useEffect(() => {
    function handleOutside(event: MouseEvent | TouchEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handleOutside)
    window.addEventListener('touchstart', handleOutside)

    return () => {
      window.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('touchstart', handleOutside)
    }
  }, [])

  const suggestions = useMemo(() => {
    if (!normalized) {
      return []
    }

    return searchStoreProducts(products, normalized).slice(0, 7)
  }, [normalized, products])

  function openSearch() {
    setOpen(true)
    window.setTimeout(() => inputRef.current?.focus(), 10)
  }

  function submitSearch() {
    const value = query.trim()
    if (!value) {
      openSearch()
      return
    }

    setOpen(false)
    router.push(`/buscar?q=${encodeURIComponent(value)}`)
  }

  function goToProduct(productId: number) {
    setOpen(false)
    router.push(`/producto/${productId}`)
  }

  return (
    <>
      {open ? <div className="fixed inset-0 z-40 bg-[rgba(245,245,247,0.78)] backdrop-blur-2xl" /> : null}

      <div ref={wrapperRef} className="relative z-50">
        <button
          type="button"
          onMouseEnter={openSearch}
          onClick={openSearch}
          aria-label="Abrir búsqueda"
          className="inline-flex h-[3.3rem] w-[3.3rem] items-center justify-center text-[#1d1d1f] transition hover:text-[#0071e3]"
        >
          <svg
            viewBox="0 0 24 24"
            height="27"
            width="27"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          >
            <circle cx="10.5" cy="10.5" r="5.75" />
            <path d="m14.75 14.75 4.75 4.75" />
          </svg>
        </button>

        {open ? (
          <div
            className="fixed inset-x-0 top-[5.1rem] z-50 px-4 md:px-8 xl:px-12"
            onMouseLeave={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect()
              const leftExit = event.clientX < bounds.left
              const rightExit = event.clientX > bounds.right
              const bottomExit = event.clientY > bounds.bottom

              if (leftExit || rightExit || bottomExit) {
                setOpen(false)
              }
            }}
          >
            <div className="mx-auto max-w-[980px] overflow-hidden rounded-[34px] border border-[#0071e3]/12 bg-[rgba(255,255,255,0.94)] shadow-[0_28px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl">
              <div className="px-6 pt-6 md:px-8 md:pt-8">
                <div className="flex items-center gap-4 border-b border-[#0071e3]/12 pb-4">
                  <svg
                    viewBox="0 0 24 24"
                    height="20"
                    width="20"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    className="text-[#6e6e73]"
                  >
                    <circle cx="10.5" cy="10.5" r="5.75" />
                    <path d="m14.75 14.75 4.75 4.75" />
                  </svg>
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        submitSearch()
                      }
                    }}
                    placeholder="Busca por producto, categoría o SKU"
                    className="w-full bg-transparent text-[1.15rem] font-medium text-[#1d1d1f] outline-none placeholder:text-[#86868b] md:text-[1.35rem]"
                  />
                  <button
                    type="button"
                    onClick={submitSearch}
                    className="inline-flex h-[2.6rem] w-[2.6rem] items-center justify-center text-[#1d1d1f] transition hover:text-[#0071e3]"
                    aria-label="Buscar"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      height="18"
                      width="18"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    >
                      <circle cx="10.5" cy="10.5" r="5.75" />
                      <path d="m14.75 14.75 4.75 4.75" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 md:px-8 md:py-6">
                <p className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-[#86868b]">
                  {normalized ? 'Productos relacionados' : 'Empieza a escribir'}
                </p>

                {!normalized ? (
                  <p className="mt-3 max-w-[34rem] text-[0.96rem] leading-8 text-[#424245]">
                    Escribe el nombre del producto, una categoría o su SKU y aquí empezarán a aparecer coincidencias.
                  </p>
                ) : suggestions.length > 0 ? (
                  <div className="mt-4 space-y-1">
                    {suggestions.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => goToProduct(product.id)}
                        className="flex w-full items-center justify-between gap-4 rounded-[20px] px-3 py-3 text-left transition hover:bg-[#f7fbff]"
                      >
                        <div>
                          <p className="text-[0.98rem] font-semibold text-[#1d1d1f]">
                            {product.nombre || 'Producto'}
                          </p>
                          <p className="mt-1 text-[0.82rem] text-[#6e6e73]">
                            {product.categoria || 'General'} · {product.sku || 'Sin SKU'}
                          </p>
                        </div>
                        <span className="text-[0.9rem] font-semibold text-[#1d1d1f]">
                          {money.format(Number(product.precio_venta || 0))}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-[0.96rem] leading-8 text-[#424245]">
                    No encontramos resultados para esa búsqueda.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
