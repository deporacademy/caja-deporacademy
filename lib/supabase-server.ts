// Archivo para usar SOLO en API routes y Server Components
// No importar en componentes cliente

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  // Usar SERVICE_ROLE_KEY para bypass de RLS en operaciones administrativas
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
