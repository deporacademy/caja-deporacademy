import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos de TypeScript para las tablas
export type Categoria = {
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
