import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Cliente para uso en el servidor (API routes)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // No-op: Cookies cannot be set in Server Components
          }
        },
      },
    }
  )
}

// Tipos de TypeScript para las tablas
export type Categoria = {
  id: string
  nombre: string
  color: string
  created_at: string
}

export type CategoriaIngreso = {
  id: string
  nombre: string
  color: string
  created_at: string
}

export type Moneda = 'USD' | 'UYU'

export type Ingreso = {
  id: string
  mercadopago_id: string
  monto: number
  descripcion: string | null
  fecha: string
  estado: 'approved' | 'pending' | 'rejected'
  comprador_email: string | null
  categoria_id: string | null
  moneda: Moneda
  metadata: any
  created_at: string
}

export type Gasto = {
  id: string
  monto: number
  descripcion: string
  fecha: string
  categoria_id: string | null
  comprobante_url: string | null
  comprobante_base64: string | null
  moneda: Moneda
  notas: string | null
  created_at: string
}

export type Conversion = {
  id: string
  fecha: string
  monto_origen: number
  moneda_origen: Moneda
  monto_destino: number
  moneda_destino: Moneda
  tipo_cambio: number
  notas: string | null
  created_at: string
}
