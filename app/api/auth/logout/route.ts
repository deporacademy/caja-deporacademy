import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true })
    
    // Eliminar el token de la cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0 // Eliminar inmediatamente
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
