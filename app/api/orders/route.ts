import { NextRequest, NextResponse } from 'next/server'

type ServiceType =
  | 'road_assistance'
  | 'tow_truck'
  | 'battery'
  | 'tire_service'
  | 'fuel_delivery'
  | 'car_unlock'
  | 'car_wash'
  | 'service_station'

type ProviderType =
  | 'master'
  | 'tow_truck'
  | 'electrician'
  | 'tire_service'
  | 'fuel_delivery'
  | 'locksmith'
  | 'car_wash'
  | 'service_station'

type DbOrder = {
  id: string
  problem: string
  location: string
  client: string
  vehicle: string
  price: number
  status: string
  master: string | null
  service_type: ServiceType
  provider_type: ProviderType
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
  serviceType: ServiceType
  providerType: ProviderType
  createdAt: string
}

type OrderPatch = {
  problem?: string
  location?: string
  client?: string
  vehicle?: string
  price?: number
  status?: string
  master?: string | null
  service_type?: ServiceType
  provider_type?: ProviderType
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '')

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const completedStatuses = new Set(['Завершён', 'Отменён'])

const serviceProviderMap: Record<ServiceType, ProviderType> = {
  road_assistance: 'master',
  tow_truck: 'tow_truck',
  battery: 'electrician',
  tire_service: 'tire_service',
  fuel_delivery: 'fuel_delivery',
  car_unlock: 'locksmith',
  car_wash: 'car_wash',
  service_station: 'service_station',
}

const allowedServiceTypes = new Set<ServiceType>([
  'road_assistance',
  'tow_truck',
  'battery',
  'tire_service',
  'fuel_delivery',
  'car_unlock',
  'car_wash',
  'service_station',
])

const allowedProviderTypes = new Set<ProviderType>([
  'master',
  'tow_truck',
  'electrician',
  'tire_service',
  'fuel_delivery',
  'locksmith',
  'car_wash',
  'service_station',
])

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

function buildOrdersUrl(params: URLSearchParams) {
  return `${supabaseUrl}/rest/v1/orders?${params.toString()}`
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

function normalizeServiceType(value: unknown): ServiceType {
  const serviceType = String(value || '').trim() as ServiceType

  if (allowedServiceTypes.has(serviceType)) {
    return serviceType
  }

  return 'road_assistance'
}

function normalizeProviderType(
  value: unknown,
  serviceType: ServiceType
): ProviderType {
  const providerType = String(value || '').trim() as ProviderType

  if (allowedProviderTypes.has(providerType)) {
    return providerType
  }

  return serviceProviderMap[serviceType]
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
    serviceType: row.service_type || 'road_assistance',
    providerType: row.provider_type || 'master',
    createdAt: row.created_at,
  }
}

async function fetchOrders(
  params: URLSearchParams
): Promise<{
  rows?: DbOrder[]
  error?: NextResponse
}> {
  const response = await fetch(buildOrdersUrl(params), {
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
        response.status
      ),
    }
  }

  return {
    rows: (Array.isArray(data) ? data : []) as DbOrder[],
  }
}

async function fetchOrderById(
  id: string
): Promise<{
  order?: DbOrder
  error?: NextResponse
}> {
  const params = new URLSearchParams()

  params.set('select', '*')
  params.set('id', `eq.${id}`)
  params.set('limit', '1')

  const result = await fetchOrders(params)

  if (result.error) {
    return {
      error: result.error,
    }
  }

  return {
    order: result.rows?.[0],
  }
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

function sortByCreatedAt(rows: DbOrder[]) {
  return [...rows].sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
  )
}

function uniqueOrders(rows: DbOrder[]) {
  const result = new Map<string, DbOrder>()

  for (const row of rows) {
    result.set(String(row.id), row)
  }

  return sortByCreatedAt(Array.from(result.values()))
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

    const requestedServiceType =
      request.nextUrl.searchParams.get('service_type') ||
      request.nextUrl.searchParams.get('serviceType')

    const requestedProviderType =
      request.nextUrl.searchParams.get('provider_type') ||
      request.nextUrl.searchParams.get('providerType')

    /*
     * Запрос конкретного заказа.
     */
    if (id) {
      const result = await fetchOrderById(id)

      if (result.error) {
        return result.error
      }

      const order = result.order ? toShared(result.order) : null

      return NextResponse.json(
        {
          order,
          orders: order ? [order] : [],
        },
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        }
      )
    }

    /*
     * Кабинет исполнителя.
     *
     * Исполнитель получает:
     * 1. свои ранее принятые заказы;
     * 2. новые свободные заказы только своего provider_type.
     */
    if (master) {
      const providerType = normalizeProviderType(
        requestedProviderType || 'master',
        'road_assistance'
      )

      const assignedParams = new URLSearchParams()

      assignedParams.set('select', '*')
      assignedParams.set('master', `eq.${master}`)
      assignedParams.set('order', 'created_at.desc')

      if (status) {
        assignedParams.set('status', `eq.${status}`)
      }

      if (requestedServiceType) {
        assignedParams.set(
          'service_type',
          `eq.${normalizeServiceType(requestedServiceType)}`
        )
      }

      const openParams = new URLSearchParams()

      openParams.set('select', '*')
      openParams.set('master', 'is.null')
      openParams.set('status', 'eq.Новый заказ')
      openParams.set('provider_type', `eq.${providerType}`)
      openParams.set('order', 'created_at.desc')

      if (requestedServiceType) {
        openParams.set(
          'service_type',
          `eq.${normalizeServiceType(requestedServiceType)}`
        )
      }

      const [assignedResult, openResult] = await Promise.all([
        fetchOrders(assignedParams),
        fetchOrders(openParams),
      ])

      if (assignedResult.error) {
        return assignedResult.error
      }

      if (openResult.error) {
        return openResult.error
      }

      const rows = uniqueOrders([
        ...(assignedResult.rows || []),
        ...(openResult.rows || []),
      ])

      const orders = rows.map(toShared)

      const activeOrder =
        orders.find(
          order =>
            !completedStatuses.has(order.status) &&
            (
              order.master === master ||
              (
                !order.master &&
                order.status === 'Новый заказ' &&
                order.providerType === providerType
              )
            )
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
        }
      )
    }

    /*
     * История и текущие заказы клиента.
     */
    const params = new URLSearchParams()

    params.set('select', '*')
    params.set('order', 'created_at.desc')

    if (client) {
      params.set('client', `eq.${client}`)
    }

    if (status) {
      params.set('status', `eq.${status}`)
    }

    if (requestedServiceType) {
      params.set(
        'service_type',
        `eq.${normalizeServiceType(requestedServiceType)}`
      )
    }

    if (requestedProviderType) {
      params.set(
        'provider_type',
        `eq.${normalizeProviderType(
          requestedProviderType,
          normalizeServiceType(requestedServiceType)
        )}`
      )
    }

    const result = await fetchOrders(params)

    if (result.error) {
      return result.error
    }

    const orders = (result.rows || []).map(toShared)

    const activeOrder =
      orders.find(order => !completedStatuses.has(order.status)) || null

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

    const body = (await request
      .json()
      .catch(() => null)) as Record<string, unknown> | null

    if (!body) {
      return NextResponse.json(
        {
          error: 'Переданы неправильные данные заказа',
        },
        { status: 400 }
      )
    }

    const price = Number(body.price ?? 7000)

    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        {
          error: 'Неправильно указана стоимость заказа',
        },
        { status: 400 }
      )
    }

    const serviceType = normalizeServiceType(
      body.service_type ?? body.serviceType
    )

    const providerType = normalizeProviderType(
      body.provider_type ?? body.providerType,
      serviceType
    )

    const row = {
      id: crypto.randomUUID(),
      problem: String(
        body.problem || 'Помощь на дороге'
      ).trim(),
      location: String(body.location || 'Астана').trim(),
      client: String(body.client || 'Ержан Т.').trim(),
      vehicle: String(
        body.vehicle || 'Toyota Prado 120'
      ).trim(),
      price,
      status: String(body.status || 'Новый заказ').trim(),
      master: body.master
        ? String(body.master).trim()
        : null,
      service_type: serviceType,
      provider_type: providerType,
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
      }
    )

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
        {
          error: 'Supabase не вернул созданный заказ',
        },
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

    const body = (await request
      .json()
      .catch(() => null)) as Record<string, unknown> | null

    if (!body) {
      return NextResponse.json(
        {
          error: 'Переданы неправильные данные заказа',
        },
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
        {
          error: 'Заказ не найден',
        },
        { status: 404 }
      )
    }

    const currentResult = await fetchOrderById(id)

    if (currentResult.error) {
      return currentResult.error
    }

    const currentOrder = currentResult.order

    if (!currentOrder) {
      return NextResponse.json(
        {
          error: 'Заказ не найден',
        },
        { status: 404 }
      )
    }

    const patch: OrderPatch = {}

    if (body.status !== undefined) {
      patch.status = String(body.status).trim()
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
          {
            error: 'Неправильно указана стоимость заказа',
          },
          { status: 400 }
        )
      }

      patch.price = price
    }

    if (
      body.service_type !== undefined ||
      body.serviceType !== undefined
    ) {
      patch.service_type = normalizeServiceType(
        body.service_type ?? body.serviceType
      )
    }

    if (
      body.provider_type !== undefined ||
      body.providerType !== undefined
    ) {
      patch.provider_type = normalizeProviderType(
        body.provider_type ?? body.providerType,
        patch.service_type || currentOrder.service_type
      )
    }

    const requestedMaster =
      body.master !== undefined
        ? body.master
          ? String(body.master).trim()
          : null
        : undefined

    if (requestedMaster !== undefined) {
      if (
        currentOrder.master &&
        requestedMaster &&
        currentOrder.master !== requestedMaster
      ) {
        return NextResponse.json(
          {
            error: 'Заказ уже принят другим исполнителем',
          },
          { status: 409 }
        )
      }

      const requestedProviderType = normalizeProviderType(
        body.provider_type ?? body.providerType ?? 'master',
        currentOrder.service_type
      )

      if (
        requestedMaster &&
        !currentOrder.master &&
        requestedProviderType !== currentOrder.provider_type
      ) {
        return NextResponse.json(
          {
            error: 'Этот заказ предназначен другому типу исполнителя',
            details: {
              orderProviderType: currentOrder.provider_type,
              requestedProviderType,
            },
          },
          { status: 403 }
        )
      }

      patch.master = requestedMaster
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        {
          error: 'Нет данных для изменения заказа',
        },
        { status: 400 }
      )
    }

    const params = new URLSearchParams()

    params.set('id', `eq.${id}`)

    /*
     * При первом принятии добавляется условие master IS NULL.
     * Благодаря этому два исполнителя не смогут одновременно принять заказ.
     */
    if (requestedMaster && !currentOrder.master) {
      params.set('master', 'is.null')
    }

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
        {
          error:
            'Заказ уже принят другим исполнителем или больше недоступен',
        },
        { status: 409 }
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

    const body = (await request
      .json()
      .catch(() => ({}))) as Record<string, unknown>

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
        {
          error: 'Заказ не найден',
        },
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
        {
          error: 'Заказ не найден',
        },
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
