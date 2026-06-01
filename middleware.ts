import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Obtener el token de autenticación del localStorage via cookie
  const authToken = req.cookies.get('auth_token')?.value

  // Si no hay token y está intentando acceder al dashboard, redirigir al login
  if (!authToken && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // Si hay token y está en la página de login, redirigir al dashboard
  if (authToken && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
}
