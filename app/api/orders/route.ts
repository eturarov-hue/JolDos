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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '')

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function configError() {
  return NextResponse.json(
    {
      error: 'Supabase не настроен',
      details:
        'Добавьте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.',
    },
    { status: 500 }
  )
}

function supabaseHeaders(extra: Record<string, string> = {}) {
  if (!supabaseKey) {
    throw new Error('Supabase API key is missing')
  }

  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

function toShared(row: DbOrder): SharedOrder {
  return {
    id: String(row.id),
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

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function errorResponse(
  message: string,
  details: unknown,
  status: number
) {
  return NextResponse.json(
    {
      error: message,
      details,
    },
    { status }
  )
}

function buildOrdersUrl(params: URLSearchParams) {
  return `${supabaseUrl}/rest/v1/orders?${params.toString()}`
}

async function findCurrentOrderId(): Promise<{
  id?: string
  error?: NextResponse
}> {
  const params = new URLSearchParams()

  params.set('select', 'id')
  params.set('status', 'not.in.(Завершён,Отменён)')
  params.set('order', 'created_at.desc')
  params.set('limit', '1')

  const response = await fetch(buildOrdersUrl(params), {
    method: 'GET',
    headers: supabaseHeaders(),
    cache: 'no-store',
  })

  const data = await readJson(response)

  if (!response.ok) {
    return {
      error: errorResponse(
        'Не удалось найти текущий заказ',
        data,
        response.status
      ),
    }
  }

  if (!Array.isArray(data) || !data[0]?.id) {
    return {}
  }

  return {
    id: String(data[0].id),
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return configError()
    }

    const id = request.nextUrl.searchParams.get('id')
    const client = request.nextUrl.searchParams.get('client')
    const master = request.nextUrl.searchParams.get('master')
    const status = request.nextUrl.searchParams.get('status')

    const params = new URLSearchParams()

    params.set('select', '*')
    params.set('order', 'created_at.desc')

    if (id) {
      params.set('id', `eq.${id}`)
      params.set('limit', '1')
    }

    if (client) {
      params.set('client', `eq.${client}`)
    }

    if (master) {
      params.set(
        'or',
        `(master.eq.${master},and(master.is.null,status.eq.Новый заказ))`
      )
    }

    if (status) {
      params.set('status', `eq.${status}`)
    }

    const response = await fetch(buildOrdersUrl(params), {
      method: 'GET',
      headers: supabaseHeaders(),
      cache: 'no-store',
    })

    const data = await readJson(response)

    if (!response.ok) {
      return errorResponse(
        'Не удалось получить заказы',
        data,
        response.status
      )
    }

    const rows = (Array.isArray(data) ? data : []) as DbOrder[]
    const orders = rows.map(toShared)

    let activeOrder: SharedOrder | null = null

    if (id) {
      activeOrder = orders[0] || null
    } else if (master) {
      activeOrder =
        orders.find(
          order =>
            order.status !== 'Завершён' &&
            order.status !== 'Отменён' &&
            (
              order.master === master ||
              (!order.master && order.status === 'Новый заказ')
            )
        ) || null
    } else {
      activeOrder =
        orders.find(
          order =>
            order.status !== 'Завершён' &&
            order.status !== 'Отменён'
        ) || null
    }

    return NextResponse.json(
      {
        order: activeOrder,
        orders,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (error) {
    return errorResponse(
      'Внутренняя ошибка сервера',
      error instanceof Error ? error.message : String(error),
      500
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return configError()
    }

    const body = await request.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Переданы неправильные данные заказа' },
        { status: 400 }
      )
    }

    const price = Number(body.price ?? 7000)

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: 'Неправильно указана стоимость заказа' },
        { status: 400 }
      )
    }

    const row = {
      id: crypto.randomUUID(),
      problem: String(body.problem || 'Помощь на дороге').trim(),
      location: String(body.location || 'Астана').trim(),
      client: String(body.client || 'Ержан Т.').trim(),
      vehicle: String(body.vehicle || 'Toyota Prado 120').trim(),
      price,
      status: String(body.status || 'Новый заказ').trim(),
      master: body.master ? String(body.master).trim() : null,
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/orders`, {
      method: 'POST',
      headers: supabaseHeaders({
        Prefer: 'return=representation',
      }),
      body: JSON.stringify(row),
      cache: 'no-store',
    })

    const data = await readJson(response)

    if (!response.ok) {
      return errorResponse(
        'Не удалось создать заказ',
        data,
        response.status
      )
    }

    const created = (
      Array.isArray(data) ? data[0] : data
    ) as DbOrder | undefined

    if (!created) {
      return NextResponse.json(
        { error: 'Supabase не вернул созданный заказ' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        order: toShared(created),
      },
      { status: 201 }
    )
  } catch (error) {
    return errorResponse(
      'Внутренняя ошибка сервера',
      error instanceof Error ? error.message : String(error),
      500
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return configError()
    }

    const body = await request.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Переданы неправильные данные заказа' },
        { status: 400 }
      )
    }

    let id = body.id ? String(body.id) : ''

    if (!id) {
      const current = await findCurrentOrderId()

      if (current.error) {
        return current.error
      }

      id = current.id || ''
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      )
    }

    const patch: Record<string, string | number | null> = {}

    if (body.status !== undefined) {
      patch.status = String(body.status).trim()
    }

    if (body.master !== undefined) {
      patch.master = body.master
        ? String(body.master).trim()
        : null
    }

    if (body.problem !== undefined) {
      patch.problem = String(body.problem).trim()
    }

    if (body.location !== undefined) {
      patch.location = String(body.location).trim()
    }

    if (body.client !== undefined) {
      patch.client = String(body.client).trim()
    }

    if (body.vehicle !== undefined) {
      patch.vehicle = String(body.vehicle).trim()
    }

    if (body.price !== undefined) {
      const price = Number(body.price)

      if (!Number.isFinite(price) || price < 0) {
        return NextResponse.json(
          { error: 'Неправильно указана стоимость заказа' },
          { status: 400 }
        )
      }

      patch.price = price
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: 'Нет данных для изменения заказа' },
        { status: 400 }
      )
    }

    const params = new URLSearchParams()

    params.set('id', `eq.${id}`)

    const response = await fetch(buildOrdersUrl(params), {
      method: 'PATCH',
      headers: supabaseHeaders({
        Prefer: 'return=representation',
      }),
      body: JSON.stringify(patch),
      cache: 'no-store',
    })

    const data = await readJson(response)

    if (!response.ok) {
      return errorResponse(
        'Не удалось обновить заказ',
        data,
        response.status
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
  } catch (error) {
    return errorResponse(
      'Внутренняя ошибка сервера',
      error instanceof Error ? error.message : String(error),
      500
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return configError()
    }

    const body = await request.json().catch(() => ({}))

    let id = String(
      body.id ||
        request.nextUrl.searchParams.get('id') ||
        ''
    )

    if (!id) {
      const current = await findCurrentOrderId()

      if (current.error) {
        return current.error
      }

      id = current.id || ''
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      )
    }

    const params = new URLSearchParams()

    params.set('id', `eq.${id}`)

    const response = await fetch(buildOrdersUrl(params), {
      method: 'PATCH',
      headers: supabaseHeaders({
        Prefer: 'return=representation',
      }),
      body: JSON.stringify({
        status: 'Отменён',
      }),
      cache: 'no-store',
    })

    const data = await readJson(response)

    if (!response.ok) {
      return errorResponse(
        'Не удалось отменить заказ',
        data,
        response.status
      )
    }

    const cancelled = (
      Array.isArray(data) ? data[0] : data
    ) as DbOrder | undefined

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      order: toShared(cancelled),
    })
  } catch (error) {
    return errorResponse(
      'Внутренняя ошибка сервера',
      error instanceof Error ? error.message : String(error),
      500
    )
  }
}
