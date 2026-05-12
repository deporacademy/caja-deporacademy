import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const payment = new Payment(client)

export async function getPayments(filters?: {
  dateFrom?: string
  dateTo?: string
  status?: string
}) {
  try {
    const searchParams: any = {
      limit: 100,
      offset: 0,
      sort: 'date_created',
      criteria: 'desc',
    }

    // Si hay begin_date, DEBE haber end_date
    if (filters?.dateFrom) {
      searchParams.range = `date_created`
      searchParams.begin_date = filters.dateFrom
      searchParams.end_date = filters.dateTo || new Date().toISOString()
    }

    if (filters?.status) {
      searchParams.status = filters.status
    }

    const response = await payment.search({
      options: searchParams,
    })

    return response.results || []
  } catch (error) {
    console.error('Error fetching MercadoPago payments:', error)
    throw error
  }
}

export async function getPaymentById(paymentId: string) {
  try {
    const response = await payment.get({ id: paymentId })
    return response
  } catch (error) {
    console.error('Error fetching MercadoPago payment:', error)
    throw error
  }
}

export { payment }
