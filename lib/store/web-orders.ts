export type StorePaymentMethod = 'qr' | 'transferencia' | 'efectivo'

export type WebOrderItemInput = {
  productId: number
  quantity: number
}

export type WebOrderCustomerInput = {
  nombreCompleto: string
  telefono: string
  ciudad: string
  direccion: string
  correo?: string
}

export type CreateWebOrderPayload = {
  paymentMethod: StorePaymentMethod
  customer: WebOrderCustomerInput
  accountEmail?: string
  items: WebOrderItemInput[]
}

export type CreateWebOrderSuccess = {
  ok: true
  orderId: number
  orderCode: string
}

export type CreateWebOrderError = {
  ok: false
  error: string
}

export type CreateWebOrderResponse = CreateWebOrderSuccess | CreateWebOrderError
