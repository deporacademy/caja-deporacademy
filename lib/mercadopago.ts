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
    console.log('🔍 Buscando pagos con filtros:', filters)
    
    const searchParams: any = {
      limit: 100,
      offset: 0,
      sort: 'date_created',
      criteria: 'desc',
    }

    // Agregar rango de fechas si se proporciona
    if (filters?.dateFrom) {
      searchParams.begin_date = filters.dateFrom
      searchParams.end_date = filters.dateTo || new Date().toISOString()
      console.log('📅 Rango de fechas:', searchParams.begin_date, 'a', searchParams.end_date)
    }

    // Agregar estado si se proporciona
    if (filters?.status) {
      searchParams.status = filters.status
      console.log('📊 Filtrando por estado:', filters.status)
    }

    console.log('🚀 Parámetros de búsqueda:', searchParams)

    const response = await payment.search({
      options: searchParams,
    })

    console.log('✅ Pagos encontrados:', response.results?.length || 0)
    
    return response.results || []
  } catch (error: any) {
    console.error('❌ Error fetching MercadoPago payments:', {
      message: error.message,
      status: error.status,
      response: error.response
    })
    throw error
  }
}

export async function getPaymentById(paymentId: string) {
  try {
    console.log('🔍 Obteniendo pago:', paymentId)
    const response = await payment.get({ id: paymentId })
    console.log('✅ Pago obtenido correctamente')
    return response
  } catch (error: any) {
    console.error('❌ Error fetching MercadoPago payment:', {
      paymentId,
      message: error.message,
      status: error.status
    })
    throw error
  }
}

export { payment }
