import { NextRequest, NextResponse } from 'next/server'
import { TEST_MASTER_LIST } from '@/lib/test-masters'

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
  service_type: string
  provider_type: string
  cancelled_by: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
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
  serviceType: string
  providerType: string
  cancelledBy?: string
  cancellationReason?: string
  cancelledAt?: string
}

type RejectionRow = {
  order_id: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '')
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function configError() {
  return NextResponse.json(
    {
      error: 'Supabase не настроен',
      details:
        'Добавьте NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY либо NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    },
    { status: 500 },
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

function ordersUrl(params: URLSearchParams) {
  return `${supabaseUrl}/rest/v1/orders?${params.toString()}`
}

function rejectionsUrl(params: URLSearchParams) {
  return `${supabaseUrl}/rest/v1/order_rejections?${params.toString()}`
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
  error: string,
  details: unknown,
  status: number,
) {
  return NextResponse.json(
    {
      error,
      details,
    },
    { status },
  )
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
    serviceType: row.service_type,
    providerType: row.provider_type,
    cancelledBy: row.cancelled_by || undefined,
    cancellationReason: row.cancellation_reason || undefined,
    cancelledAt: row.cancelled_at || undefined,
  }
}

async function fetchOrders(params: URLSearchParams) {
  const response = await fetch(ordersUrl(params), {
    method: 'GET',
    headers: supabaseHeaders(),
    cache: 'no-store',
  })

  const data = await readJson(response)

  if (!response.ok) {
    return {
      error: errorResponse(
        'Не удалось получить заказы',
        data,
        response.status,
      ),
      rows: [] as DbOrder[],
    }
  }

  return {
    rows: (Array.isArray(data) ? data : []) as DbOrder[],
  }
}

async function fetchRejectedOrderIds(providerName: string) {
  const params = new URLSearchParams()
  params.set('select', 'order_id')
  params.set('provider_name', `eq.${providerName}`)

  const response = await fetch(rejectionsUrl(params), {
    method: 'GET',
    headers: supabaseHeaders(),
    cache: 'no-store',
  })

  const data = await readJson(response)

  if (!response.ok) {
    throw new Error(
      typeof data === 'string'
        ? data
        : 'Не удалось получить отказы мастера',
    )
  }

  return new Set(
    ((Array.isArray(data) ? data : []) as RejectionRow[]).map(
      item => String(item.order_id),
    ),
  )
}

function uniqueOrders(rows: DbOrder[]) {
  const map = new Map<string, DbOrder>()

  for (const row of rows) {
    map.set(String(row.id), row)
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime(),
  )
}


const SERVICE_PROVIDER_TYPES: Record<string, string[]> = {
  tow_truck: ['tow_truck'],
  battery: ['master', 'electrician'],
  tire_service: ['tire_service'],
  fuel_delivery: ['master', 'fuel_delivery'],
  car_unlock: ['master', 'locksmith'],
  road_assistance: ['master'],
  starter: ['electrician'],
  generator: ['electrician'],
  electrical_diagnostics: ['electrician'],
  car_wash: ['car_wash'],
  service_station: ['service_station'],
}

function providerCanHandleOrder(
  row: DbOrder,
  providerType: string | null,
) {
  if (!providerType) {
    return true
  }

  const allowed =
    SERVICE_PROVIDER_TYPES[row.service_type] ||
    [row.provider_type]

  return allowed.includes(providerType)
}


const DRIVER_VISIBLE_STATUSES = [
  'Новый заказ',
  'Ищем мастера',
  'Мастер принял заказ',
  'Мастер едет',
  'Мастер прибыл',
  'Работа выполняется',
  'Нет свободных специалистов',
]

async function updateOrder(
  id: string,
  patch: Record<string, string | number | null>,
) {
  const params = new URLSearchParams()
  params.set('id', `eq.${id}`)

  const response = await fetch(ordersUrl(params), {
    method: 'PATCH',
    headers: supabaseHeaders({
      Prefer: 'return=representation',
    }),
    body: JSON.stringify(patch),
    cache: 'no-store',
  })

  const data = await readJson(response)

  if (!response.ok) {
    return {
      error: errorResponse(
        'Не удалось обновить заказ',
        data,
        response.status,
      ),
      order: null as DbOrder | null,
    }
  }

  const order = (
    Array.isArray(data) ? data[0] : data
  ) as DbOrder | undefined

  return {
    order: order || null,
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
    const providerType =
      request.nextUrl.searchParams.get('providerType')
    const status = request.nextUrl.searchParams.get('status')

    if (id) {
      const params = new URLSearchParams()
      params.set('select', '*')
      params.set('id', `eq.${id}`)
      params.set('limit', '1')

      const result = await fetchOrders(params)

      if (result.error) {
        return result.error
      }

      const orders = result.rows.map(toShared)

      return NextResponse.json(
        {
          order: orders[0] || null,
          orders,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        },
      )
    }

    if (client) {
      const params = new URLSearchParams()
      params.set('select', '*')
      params.set('client', `eq.${client}`)
      params.set('order', 'created_at.desc')

      if (status) {
        params.set('status', `eq.${status}`)
      }

      const result = await fetchOrders(params)

      if (result.error) {
        return result.error
      }

      const orders = result.rows.map(toShared)
      const activeOrder =
        orders.find(order =>
          DRIVER_VISIBLE_STATUSES.includes(order.status),
        ) || null

      return NextResponse.json(
        {
          order: activeOrder,
          orders,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        },
      )
    }

    if (master) {
      const assignedParams = new URLSearchParams()
      assignedParams.set('select', '*')
      assignedParams.set('master', `eq.${master}`)
      assignedParams.set('order', 'created_at.desc')

      const availableParams = new URLSearchParams()
      availableParams.set('select', '*')
      availableParams.set('master', 'is.null')
      availableParams.set('status', 'eq.Новый заказ')
      availableParams.set('order', 'created_at.desc')

      const [assignedResult, availableResult, rejectedIds] =
        await Promise.all([
          fetchOrders(assignedParams),
          fetchOrders(availableParams),
          fetchRejectedOrderIds(master),
        ])

      if (assignedResult.error) {
        return assignedResult.error
      }

      if (availableResult.error) {
        return availableResult.error
      }

      const availableRows = availableResult.rows.filter(
        row =>
          providerCanHandleOrder(row, providerType) &&
          !rejectedIds.has(String(row.id)),
      )

      const rows = uniqueOrders([
        ...assignedResult.rows,
        ...availableRows,
      ])

      const orders = rows.map(toShared)
      const activeOrder =
        orders.find(order =>
          [
            'Мастер принял заказ',
            'Мастер едет',
            'Мастер прибыл',
            'Работа выполняется',
          ].includes(order.status),
        ) ||
        orders.find(order => order.status === 'Новый заказ') ||
        null

      return NextResponse.json(
        {
          order: activeOrder,
          orders,
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        },
      )
    }

    const params = new URLSearchParams()
    params.set('select', '*')
    params.set('order', 'created_at.desc')

    if (status) {
      params.set('status', `eq.${status}`)
    }

    const result = await fetchOrders(params)

    if (result.error) {
      return result.error
    }

    const orders = result.rows.map(toShared)
    const activeOrder =
      orders.find(order =>
        [
          'Новый заказ',
          'Мастер принял заказ',
          'Мастер едет',
          'Мастер прибыл',
          'Работа выполняется',
        ].includes(order.status),
      ) || null

    return NextResponse.json(
      {
        order: activeOrder,
        orders,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    return errorResponse(
      'Внутренняя ошибка сервера',
      error instanceof Error ? error.message : String(error),
      500,
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
        { status: 400 },
      )
    }

    const price = Number(body.price ?? 7000)

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: 'Неправильно указана стоимость заказа' },
        { status: 400 },
      )
    }

    const client = String(body.client || 'Ержан Т.').trim()

    const activeParams = new URLSearchParams()
    activeParams.set('select', 'id,status')
    activeParams.set('client', `eq.${client}`)
    activeParams.set(
      'status',
      'in.(Новый заказ,Ищем мастера,Мастер принял заказ,Мастер едет,Мастер прибыл,Работа выполняется,Нет свободных специалистов)',
    )
    activeParams.set('limit', '1')

    const activeResult = await fetchOrders(activeParams)

    if (activeResult.error) {
      return activeResult.error
    }

    if (activeResult.rows.length > 0) {
      return NextResponse.json(
        {
          error: 'У водителя уже есть активный заказ',
          orderId: activeResult.rows[0].id,
        },
        { status: 409 },
      )
    }

    const row = {
      id: crypto.randomUUID(),
      problem: String(
        body.problem || 'Помощь на дороге',
      ).trim(),
      location: String(body.location || 'Астана').trim(),
      client,
      vehicle: String(
        body.vehicle || 'Toyota Prado 120',
      ).trim(),
      price,
      status: 'Новый заказ',
      master: null,
      service_type: String(
        body.serviceType || body.service_type || 'road_assistance',
      ).trim(),
      provider_type: String(
        body.providerType || body.provider_type || 'master',
      ).trim(),
      cancelled_by: null,
      cancellation_reason: null,
      cancelled_at: null,
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/orders`,
      {
        method: 'POST',
        headers: supabaseHeaders({
          Prefer: 'return=representation',
        }),
        body: JSON.stringify(row),
        cache: 'no-store',
      },
    )

    const data = await readJson(response)

    if (!response.ok) {
      return errorResponse(
        'Не удалось создать заказ',
        data,
        response.status,
      )
    }

    const created = (
      Array.isArray(data) ? data[0] : data
    ) as DbOrder | undefined

    if (!created) {
      return NextResponse.json(
        { error: 'Supabase не вернул созданный заказ' },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        order: toShared(created),
      },
      { status: 201 },
    )
  } catch (error) {
    return errorResponse(
      'Внутренняя ошибка сервера',
      error instanceof Error ? error.message : String(error),
      500,
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
        { status: 400 },
      )
    }

    const id = String(body.id || '').trim()

    if (!id) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 },
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
          { status: 400 },
        )
      }

      patch.price = price
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: 'Нет данных для изменения заказа' },
        { status: 400 },
      )
    }

    const params = new URLSearchParams()
    params.set('id', `eq.${id}`)

    const isAccepting =
      patch.status === 'Мастер принял заказ' &&
      typeof patch.master === 'string' &&
      patch.master.length > 0

    if (isAccepting) {
      params.set('status', 'eq.Новый заказ')
      params.set('master', 'is.null')
    }

    const response = await fetch(ordersUrl(params), {
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
        response.status,
      )
    }

    const updated = (
      Array.isArray(data) ? data[0] : data
    ) as DbOrder | undefined

    if (!updated) {
      return NextResponse.json(
        {
          error: isAccepting
            ? 'Заказ уже принял другой мастер'
            : 'Заказ не найден',
        },
        { status: isAccepting ? 409 : 404 },
      )
    }

    return NextResponse.json({
      order: toShared(updated),
    })
  } catch (error) {
    return errorResponse(
      'Внутренняя ошибка сервера',
      error instanceof Error ? error.message : String(error),
      500,
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return configError()
    }

    const body = await request.json().catch(() => ({}))
    const id = String(
      body.id ||
        request.nextUrl.searchParams.get('id') ||
        '',
    ).trim()

    if (!id) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 },
      )
    }

    const providerName = String(
      body.providerName ||
        body.master ||
        request.nextUrl.searchParams.get('providerName') ||
        request.nextUrl.searchParams.get('master') ||
        '',
    ).trim()

    const providerType = String(
      body.providerType ||
        request.nextUrl.searchParams.get('providerType') ||
        'master',
    ).trim()

    if (providerName) {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/order_rejections`,
        {
          method: 'POST',
          headers: supabaseHeaders({
            Prefer: 'return=representation',
          }),
          body: JSON.stringify({
            order_id: id,
            provider_name: providerName,
            provider_type: providerType,
          }),
          cache: 'no-store',
        },
      )

      const data = await readJson(response)

      if (!response.ok) {
        const text =
          typeof data === 'object' &&
          data !== null &&
          'code' in data
            ? String((data as { code?: unknown }).code || '')
            : ''

        if (text !== '23505') {
          return errorResponse(
            'Не удалось сохранить отказ мастера',
            data,
            response.status,
          )
        }
      }

      const orderParams = new URLSearchParams()
      orderParams.set('select', '*')
      orderParams.set('id', `eq.${id}`)
      orderParams.set('limit', '1')

      const orderResult = await fetchOrders(orderParams)

      if (orderResult.error) {
        return orderResult.error
      }

      const order = orderResult.rows[0]

      if (!order) {
        return NextResponse.json(
          { error: 'Заказ не найден' },
          { status: 404 },
        )
      }

      const rejectedNamesParams = new URLSearchParams()
      rejectedNamesParams.set('select', 'provider_name')
      rejectedNamesParams.set('order_id', `eq.${id}`)

      const rejectedResponse = await fetch(
        rejectionsUrl(rejectedNamesParams),
        {
          method: 'GET',
          headers: supabaseHeaders(),
          cache: 'no-store',
        },
      )

      const rejectedData = await readJson(rejectedResponse)

      if (!rejectedResponse.ok) {
        return errorResponse(
          'Не удалось проверить оставшихся мастеров',
          rejectedData,
          rejectedResponse.status,
        )
      }

      const rejectedNames = new Set(
        (Array.isArray(rejectedData) ? rejectedData : []).map(
          item =>
            String(
              (item as { provider_name?: unknown }).provider_name || '',
            ),
        ),
      )

      const suitableMasters = TEST_MASTER_LIST.filter(masterItem =>
        providerCanHandleOrder(order, masterItem.providerType),
      )

      const remainingMasters = suitableMasters.filter(
        masterItem => !rejectedNames.has(masterItem.name),
      )

      if (suitableMasters.length > 0 && remainingMasters.length === 0) {
        const updateResult = await updateOrder(id, {
          status: 'Нет свободных специалистов',
          master: null,
        })

        if (updateResult.error) {
          return updateResult.error
        }

        return NextResponse.json({
          ok: true,
          rejectedBy: providerName,
          orderId: id,
          noProvidersAvailable: true,
          order: updateResult.order
            ? toShared(updateResult.order)
            : null,
        })
      }

      return NextResponse.json({
        ok: true,
        rejectedBy: providerName,
        orderId: id,
        noProvidersAvailable: false,
        remainingProviders: remainingMasters.length,
      })
    }

    const params = new URLSearchParams()
    params.set('id', `eq.${id}`)

    const response = await fetch(ordersUrl(params), {
      method: 'PATCH',
      headers: supabaseHeaders({
        Prefer: 'return=representation',
      }),
      body: JSON.stringify({
        status: 'Отменён',
        cancelled_by: 'driver',
        cancellation_reason:
          String(body.reason || 'Отменено водителем').trim(),
        cancelled_at: new Date().toISOString(),
      }),
      cache: 'no-store',
    })

    const data = await readJson(response)

    if (!response.ok) {
      return errorResponse(
        'Не удалось отменить заказ',
        data,
        response.status,
      )
    }

    const cancelled = (
      Array.isArray(data) ? data[0] : data
    ) as DbOrder | undefined

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      order: toShared(cancelled),
    })
  } catch (error) {
    return errorResponse(
      'Внутренняя ошибка сервера',
      error instanceof Error ? error.message : String(error),
      500,
    )
  }
}
