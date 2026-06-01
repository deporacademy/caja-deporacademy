import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (username !== 'admin') {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    
    // Guardar el token en una cookie segura
    response.cookies.set('auth_token', 'admin_session_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 días
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
