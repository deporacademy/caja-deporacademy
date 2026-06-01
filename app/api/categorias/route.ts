import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nombre')

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching categorias:', error)
    return NextResponse.json(
      { error: error.message || 'Error fetching data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    const { error, data } = await supabase
      .from('categorias')
      .insert({
        nombre: body.nombre,
        color: body.color
      })
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating categoria:', error)
    return NextResponse.json(
      { error: error.message || 'Error creating category' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    const { error, data } = await supabase
      .from('categorias')
      .update({
        nombre: body.nombre,
        color: body.color
      })
      .eq('id', body.id)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating categoria:', error)
    return NextResponse.json(
      { error: error.message || 'Error updating category' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting categoria:', error)
    return NextResponse.json(
      { error: error.message || 'Error deleting category' },
      { status: 500 }
    )
  }
}
