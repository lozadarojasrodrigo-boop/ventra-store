export function formatWebOrderStatus(status: string) {
  if (status === 'pendiente') return 'Pendiente'
  if (status === 'pago_en_revision') return 'Pago en revision'
  if (status === 'procesando') return 'Procesando'
  if (status === 'confirmado') return 'Confirmado'
  if (status === 'preparando') return 'Preparando'
  if (status === 'enviado') return 'Enviado'
  if (status === 'entregado') return 'Entregado'
  if (status === 'completado') return 'Completado'
  if (status === 'cancelado') return 'Cancelado'
  return status
}

export function orderStatusClassName(status: string) {
  if (status === 'entregado' || status === 'completado') {
    return 'border-[#34c759]/18 bg-[#effbf3] text-[#237a3c]'
  }
  if (status === 'confirmado' || status === 'preparando') {
    return 'border-[#0071e3]/14 bg-[#f3f8ff] text-[#1d1d1f]'
  }
  if (status === 'pago_en_revision' || status === 'procesando') {
    return 'border-[#ff9f0a]/18 bg-[#fff8ec] text-[#9b5a00]'
  }
  if (status === 'enviado') {
    return 'border-[#5a7cff]/18 bg-[#f3f5ff] text-[#3750b5]'
  }
  if (status === 'cancelado') {
    return 'border-[#ff3b30]/18 bg-[#fff5f4] text-[#9d2f2a]'
  }
  return 'border-[#0071e3]/14 bg-[#f3f8ff] text-[#1d1d1f]'
}

export function getWebOrderTimeline(status: string) {
  const cancelled = status === 'cancelado'

  if (cancelled) {
    return [
      {
        key: 'pending',
        title: 'Pedido recibido',
        description: 'Tu compra fue registrada en la tienda.',
        state: 'done' as const,
      },
      {
        key: 'cancelled',
        title: 'Pedido cancelado',
        description: 'El pedido fue cancelado antes de completar la entrega.',
        state: 'current' as const,
      },
    ]
  }

  const steps = [
    {
      key: 'pending',
      title: 'Pedido recibido',
      description: 'Tu compra ya fue registrada correctamente.',
      statuses: ['pendiente', 'pago_en_revision', 'procesando', 'confirmado', 'preparando', 'enviado', 'entregado', 'completado'],
    },
    {
      key: 'review',
      title: 'Pago en revisión',
      description: 'Estamos validando tu comprobante o tu forma de pago.',
      statuses: ['pago_en_revision', 'procesando', 'confirmado', 'preparando', 'enviado', 'entregado', 'completado'],
    },
    {
      key: 'confirmed',
      title: 'Pago confirmado',
      description: 'El pedido ya quedó confirmado en el sistema.',
      statuses: ['confirmado', 'preparando', 'enviado', 'entregado', 'completado'],
    },
    {
      key: 'preparing',
      title: 'Preparando pedido',
      description: 'Estamos alistando los productos para tu entrega.',
      statuses: ['preparando', 'enviado', 'entregado', 'completado'],
    },
    {
      key: 'shipping',
      title: 'Enviado',
      description: 'Tu pedido ya va en camino o fue despachado.',
      statuses: ['enviado', 'entregado', 'completado'],
    },
    {
      key: 'delivered',
      title: 'Entregado',
      description: 'La entrega del pedido ya fue completada.',
      statuses: ['entregado', 'completado'],
    },
  ]

  let currentFound = false

  return steps.map((step) => {
    const includesCurrent = step.statuses.includes(status)

    if (!currentFound && includesCurrent) {
      currentFound = true
      return {
        key: step.key,
        title: step.title,
        description: step.description,
        state: 'current' as const,
      }
    }

    return {
      key: step.key,
      title: step.title,
      description: step.description,
      state: currentFound ? ('upcoming' as const) : ('done' as const),
    }
  })
}
