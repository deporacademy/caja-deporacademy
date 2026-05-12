import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createBrowserSupabaseClient()

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

export type Ingreso = {
  id: string
  mercadopago_id: string
  monto: number
  descripcion: string | null
  fecha: string
  estado: 'approved' | 'pending' | 'rejected'
  comprador_email: string | null
  categoria_id: string | null
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
  notas: string | null
  created_at: string
}
