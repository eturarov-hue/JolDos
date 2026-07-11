import { NextRequest, NextResponse } from 'next/server'

type DbOrder = {
  id: string
  problem: string
  location: string
  client: string
  vehicle: string
  price: number
  status: string
  master: string | null
  created_at: string
}

type SharedOrder = {
  id: string
  problem: string
  location: string
  client: string
  vehicle: string
  price: number
  status: string
  master?: string
  createdAt: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function configError() {
  return NextResponse.json(
    { error: 'Supabase не настроен' },
    { status: 500 }
  )
}

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: serviceKey || '',
    Authorization: `Bearer ${serviceKey || ''}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function toShared(row: DbOrder): SharedOrder {
  return {
    id: row.id,
    problem: row.problem,
    location: row.location,
    client: row.client,
    vehicle: row.vehicle,
    price: Number(row.price),
    status: row.status,
    master: row.master || undefined,
    createdAt: row.created_at,
  }
}

async function readJson(response: Response) {
  const text = await response.text()

  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function GET(request: NextRequest) {
  if (!supabaseUrl || !serviceKey) return configError()

  const id = request.nextUrl.searchParams.get('id')
  const client = request.nextUrl.searchParams.get('client')
  const master = request.nextUrl.searchParams.get('master')
  const status = request.nextUrl.searchParams.get('status')

  const params = new URLSearchParams()
  params.set('select', '*')
  params.set('order', 'created_at.desc')

  if (id) params.set('id', `eq.${id}`)
  if (client) params.set('client', `eq.${client}`)
  if (master) params.set('master', `eq.${master}`)
  if (status) params.set('status', `eq.${status}`)
  if (id) params.set('limit', '1')

  const response = await fetch(
    `${supabaseUrl}/rest/v1/orders?${params.toString()}`,
    {
      headers: headers(),
      cache: 'no-store',
    }
  )

  const data = await readJson(response)

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Не удалось получить заказы', details: data },
      { status: response.status }
    )
  }

  const rows = (Array.isArray(data) ? data : []) as DbOrder[]
  const orders = rows.map(toShared)

  const order =
    orders.find(
      item => !['Завершён', 'Отменён'].includes(item.status)
    ) || null

  return NextResponse.json(
    {
      order: id ? orders[0] || null : order,
      orders,
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !serviceKey) return configError()

  const body = await request.json()

  const row = {
    id: String(Date.now()),
    problem: String(body.problem || 'Помощь на дороге'),
    location: String(body.location || 'Астана'),
    client: String(body.client || 'Ержан Т.'),
    vehicle: String(body.vehicle || 'Toyota Prado 120'),
    price: Number(body.price || 7000),
    status: 'Новый заказ',
    master: null,
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/orders`,
    {
      method: 'POST',
      headers: headers({
        Prefer: 'return=representation',
      }),
      body: JSON.stringify(row),
    }
  )

  const data = await readJson(response)

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Не удалось создать заказ', details: data },
      { status: response.status }
    )
  }

  const created = (
    Array.isArray(data) ? data[0] : data
  ) as DbOrder

  return NextResponse.json(
    { order: toShared(created) },
    { status: 201 }
  )
}

export async function PATCH(request: NextRequest) {
  if (!supabaseUrl || !serviceKey) return configError()

  const body = await request.json()
  let id = String(body.id || '')

  if (!id) {
    const currentResponse = await fetch(
      `${supabaseUrl}/rest/v1/orders?select=id&status=not.in.(Завершён,Отменён)&order=created_at.desc&limit=1`,
      {
        headers: headers(),
        cache: 'no-store',
      }
    )

    const currentData = await readJson(currentResponse)

    if (!currentResponse.ok) {
      return NextResponse.json(
        {
          error: 'Не удалось найти заказ',
          details: currentData,
        },
        { status: currentResponse.status }
      )
    }

    id = String(
      Array.isArray(currentData)
        ? currentData[0]?.id || ''
        : ''
    )
  }

  if (!id) {
    return NextResponse.json(
      { error: 'Заказ не найден' },
      { status: 404 }
    )
  }

  const patch: Record<string, unknown> = {}

  if (body.status !== undefined) {
    patch.status = String(body.status)
  }

  if (body.master !== undefined) {
    patch.master = body.master
      ? String(body.master)
      : null
  }

  if (body.problem !== undefined) {
    patch.problem = String(body.problem)
  }

  if (body.location !== undefined) {
    patch.location = String(body.location)
  }

  if (body.client !== undefined) {
    patch.client = String(body.client)
  }

  if (body.vehicle !== undefined) {
    patch.vehicle = String(body.vehicle)
  }

  if (body.price !== undefined) {
    patch.price = Number(body.price)
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: headers({
        Prefer: 'return=representation',
      }),
      body: JSON.stringify(patch),
    }
  )

  const data = await readJson(response)

  if (!response.ok) {
    return NextResponse.json(
      {
        error: 'Не удалось обновить заказ',
        details: data,
      },
      { status: response.status }
    )
  }

  const updated = (
    Array.isArray(data) ? data[0] : data
  ) as DbOrder | undefined

  if (!updated) {
    return NextResponse.json(
      { error: 'Заказ не найден' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    order: toShared(updated),
  })
}

export async function DELETE(request: NextRequest) {
  if (!supabaseUrl || !serviceKey) return configError()

  const body = await request.json().catch(() => ({}))

  let id = String(
    body.id ||
      request.nextUrl.searchParams.get('id') ||
      ''
  )

  if (!id) {
    const currentResponse = await fetch(
      `${supabaseUrl}/rest/v1/orders?select=id&status=not.in.(Завершён,Отменён)&order=created_at.desc&limit=1`,
      {
        headers: headers(),
        cache: 'no-store',
      }
    )

    const currentData = await readJson(currentResponse)

    id = String(
      Array.isArray(currentData)
        ? currentData[0]?.id || ''
        : ''
    )
  }

  if (!id) {
    return NextResponse.json(
      { error: 'Заказ не найден' },
      { status: 404 }
    )
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: headers({
        Prefer: 'return=representation',
      }),
      body: JSON.stringify({
        status: 'Отменён',
      }),
    }
  )

  const data = await readJson(response)

  if (!response.ok) {
    return NextResponse.json(
      {
        error: 'Не удалось отменить заказ',
        details: data,
      },
      { status: response.status }
    )
  }

  const updated = (
    Array.isArray(data) ? data[0] : data
  ) as DbOrder | undefined

  return NextResponse.json({
    order: updated ? toShared(updated) : null,
  })
}
