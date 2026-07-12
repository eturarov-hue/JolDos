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

type OrderStatus =
  | 'Новый заказ'
  | 'Мастер принял заказ'
  | 'Мастер едет'
  | 'Мастер прибыл'
  | 'Работа выполняется'
  | 'Завершён'
  | 'Отменён'

type DbOrder = {
  id: string
  problem: string
  location: string
  client: string
  vehicle: string
  price: number
  status: OrderStatus
  master: string | null
  service_type: ServiceType
  provider_type: ProviderType
  cancelled_by: string | null
  cancellation_reason: string | null
  cancelled_at: string | null
  created_at: string
}

type SharedOrder = {
  id: string
  problem: string
  location: string
  client: string
  vehicle: string
  price: number
  status: OrderStatus
  master?: string
  serviceType: ServiceType
  providerType: ProviderType
  cancelledBy?: string
  cancellationReason?: string
  cancelledAt?: string
  createdAt: string
}

type OrderPatch = {
  problem?: string
  location?: string
  client?: string
  vehicle?: string
  price?: number
  status?: OrderStatus
  master?: string | null
  service_type?: ServiceType
  provider_type?: ProviderType
  cancelled_by?: string | null
  cancellation_reason?: string | null
  cancelled_at?: string | null
}

type RejectionRow = {
  order_id: string
  provider_name: string
  provider_type: ProviderType
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '')

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const terminalStatuses = new Set<OrderStatus>([
  'Завершён',
  'Отменён',
])

const statusTransitions: Record<OrderStatus, OrderStatus[]> = {
  'Новый заказ': [
    'Мастер принял заказ',
    'Отменён',
  ],
  'Мастер принял заказ': [
    'Мастер едет',
    'Отменён',
  ],
  'Мастер едет': [
    'Мастер прибыл',
    'Отменён',
  ],
  'Мастер прибыл': [
    'Работа выполняется',
    'Отменён',
  ],
  'Работа выполняется': [
    'Завершён',
    'Отменён',
  ],
  'Завершён': [],
  'Отменён': [],
}

const allowedStatuses = new Set<OrderStatus>(
  Object.keys(statusTransitions) as OrderStatus[]
)

const serviceProviderMap: Record<
  ServiceType,
  ProviderType
> = {
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

function noStoreHeaders() {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  }
}

function supabaseHeaders(
  extra: Record<string, string> = {}
) {
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

function buildRejectionsUrl(params: URLSearchParams) {
  return `${supabaseUrl}/rest/v1/order_rejections?${params.toString()}`
}

async function readJson(
  response: Response
): Promise<unknown> {
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

function normalizeServiceType(
  value: unknown
): ServiceType {
  const serviceType = String(
    value || ''
  ).trim() as ServiceType

  if (allowedServiceTypes.has(serviceType)) {
    return serviceType
  }

  return 'road_assistance'
}

function normalizeProviderType(
  value: unknown,
  serviceType: ServiceType
): ProviderType {
  const providerType = String(
    value || ''
  ).trim() as ProviderType

  if (allowedProviderTypes.has(providerType)) {
    return providerType
  }

  return serviceProviderMap[serviceType]
}

function normalizeStatus(
  value: unknown
): OrderStatus | null {
  const status = String(
    value || ''
  ).trim() as OrderStatus

  return allowedStatuses.has(status)
    ? status
    : null
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
    serviceType:
      row.service_type || 'road_assistance',
    providerType:
      row.provider_type || 'master',
    cancelledBy:
      row.cancelled_by || undefined,
    cancellationReason:
      row.cancellation_reason || undefined,
    cancelledAt:
      row.cancelled_at || undefined,
    createdAt: row.created_at,
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
  const map = new Map<string, DbOrder>()

  for (const row of rows) {
    map.set(String(row.id), row)
  }

  return sortByCreatedAt(
    Array.from(map.values())
  )
}

function canChangeStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus
) {
  if (currentStatus === nextStatus) {
    return true
  }

  return statusTransitions[
    currentStatus
  ].includes(nextStatus)
}

async function fetchOrders(
  params: URLSearchParams
): Promise<{
  rows?: DbOrder[]
  error?: NextResponse
}> {
  const response = await fetch(
    buildOrdersUrl(params),
    {
      method: 'GET',
      headers: supabaseHeaders(),
      cache: 'no-store',
    }
  )

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
    rows: (
      Array.isArray(data) ? data : []
    ) as DbOrder[],
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

async function fetchRejectedOrderIds(
  providerName: string
): Promise<{
  ids?: Set<string>
  error?: NextResponse
}> {
  const params = new URLSearchParams()

  params.set('select', 'order_id')
  params.set(
    'provider_name',
    `eq.${providerName}`
  )

  const response = await fetch(
    buildRejectionsUrl(params),
    {
      method: 'GET',
      headers: supabaseHeaders(),
      cache: 'no-store',
    }
  )

  const data = await readJson(response)

  if (!response.ok) {
    return {
      error: errorResponse(
        'Не удалось получить отказы исполнителя',
        data,
        response.status
      ),
    }
  }

  const rows = (
    Array.isArray(data) ? data : []
  ) as RejectionRow[]

  return {
    ids: new Set(
      rows.map(row => String(row.order_id))
    ),
  }
}

async function createRejection(
  orderId: string,
  providerName: string,
  providerType: ProviderType
): Promise<NextResponse | null> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/order_rejections`,
    {
      method: 'POST',
      headers: supabaseHeaders({
        Prefer:
          'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify({
        order_id: orderId,
        provider_name: providerName,
        provider_type: providerType,
      }),
      cache: 'no-store',
    }
  )

  const data = await readJson(response)

  if (!response.ok) {
    return errorResponse(
      'Не удалось сохранить отказ исполнителя',
      data,
      response.status
    )
  }

  return null
}

async function findCurrentOrderId(): Promise<{
  id?: string
  error?: NextResponse
}> {
  const params = new URLSearchParams()

  params.set('select', 'id')
  params.set(
    'status',
    'not.in.(Завершён,Отменён)'
  )
  params.set('order', 'created_at.desc')
  params.set('limit', '1')

  const response = await fetch(
    buildOrdersUrl(params),
    {
      method: 'GET',
      headers: supabaseHeaders(),
      cache: 'no-store',
    }
  )

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

  if (
    !Array.isArray(data) ||
    !data[0]?.id
  ) {
    return {}
  }

  return {
    id: String(data[0].id),
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return configError()
    }

    const id =
      request.nextUrl.searchParams.get('id')

    const client =
      request.nextUrl.searchParams.get(
        'client'
      )

    const master =
      request.nextUrl.searchParams.get(
        'master'
      )

    const status =
      request.nextUrl.searchParams.get(
        'status'
      )

    const requestedServiceType =
      request.nextUrl.searchParams.get(
        'service_type'
      ) ||
      request.nextUrl.searchParams.get(
        'serviceType'
      )

    const requestedProviderType =
      request.nextUrl.searchParams.get(
        'provider_type'
      ) ||
      request.nextUrl.searchParams.get(
        'providerType'
      )

    if (id) {
      const result =
        await fetchOrderById(id)

      if (result.error) {
        return result.error
      }

      const order = result.order
        ? toShared(result.order)
        : null

      return NextResponse.json(
        {
          order,
          orders: order ? [order] : [],
        },
        {
          headers: noStoreHeaders(),
        }
      )
    }

    if (master) {
      const providerType =
        normalizeProviderType(
          requestedProviderType || 'master',
          'road_assistance'
        )

      const assignedParams =
        new URLSearchParams()

      assignedParams.set('select', '*')
      assignedParams.set(
        'master',
        `eq.${master}`
      )
      assignedParams.set(
        'order',
        'created_at.desc'
      )

      if (status) {
        assignedParams.set(
          'status',
          `eq.${status}`
        )
      }

      const openParams =
        new URLSearchParams()

      openParams.set('select', '*')
      openParams.set(
        'master',
        'is.null'
      )
      openParams.set(
        'status',
        'eq.Новый заказ'
      )
      openParams.set(
        'provider_type',
        `eq.${providerType}`
      )
      openParams.set(
        'order',
        'created_at.desc'
      )

      if (requestedServiceType) {
        const serviceType =
          normalizeServiceType(
            requestedServiceType
          )

        assignedParams.set(
          'service_type',
          `eq.${serviceType}`
        )

        openParams.set(
          'service_type',
          `eq.${serviceType}`
        )
      }

      const [
        assignedResult,
        openResult,
        rejectedResult,
      ] = await Promise.all([
        fetchOrders(assignedParams),
        fetchOrders(openParams),
        fetchRejectedOrderIds(master),
      ])

      if (assignedResult.error) {
        return assignedResult.error
      }

      if (openResult.error) {
        return openResult.error
      }

      if (rejectedResult.error) {
        return rejectedResult.error
      }

      const rejectedIds =
        rejectedResult.ids ||
        new Set<string>()

      const availableOpenOrders = (
        openResult.rows || []
      ).filter(
        row =>
          !rejectedIds.has(
            String(row.id)
          )
      )

      const rows = uniqueOrders([
        ...(assignedResult.rows || []),
        ...availableOpenOrders,
      ])

      const orders = rows.map(toShared)

      const activeOrder =
        orders.find(
          order =>
            !terminalStatuses.has(
              order.status
            ) &&
            (
              order.master === master ||
              (
                !order.master &&
                order.status ===
                  'Новый заказ' &&
                order.providerType ===
                  providerType
              )
            )
        ) || null

      return NextResponse.json(
        {
          order: activeOrder,
          orders,
        },
        {
          headers: noStoreHeaders(),
        }
      )
    }

    const params =
      new URLSearchParams()

    params.set('select', '*')
    params.set(
      'order',
      'created_at.desc'
    )

    if (client) {
      params.set(
        'client',
        `eq.${client}`
      )
    }

    if (status) {
      params.set(
        'status',
        `eq.${status}`
      )
    }

    if (requestedServiceType) {
      params.set(
        'service_type',
        `eq.${normalizeServiceType(
          requestedServiceType
        )}`
      )
    }

    if (requestedProviderType) {
      params.set(
        'provider_type',
        `eq.${normalizeProviderType(
          requestedProviderType,
          normalizeServiceType(
            requestedServiceType
          )
        )}`
      )
    }

    const result =
      await fetchOrders(params)

    if (result.error) {
      return result.error
    }

    const orders = (
      result.rows || []
    ).map(toShared)

    const activeOrder =
      orders.find(
        order =>
          !terminalStatuses.has(
            order.status
          )
      ) || null

    return NextResponse.json(
      {
        order: activeOrder,
        orders,
      },
      {
        headers: noStoreHeaders(),
      }
    )
  } catch (error) {
    return errorResponse(
      'Внутренняя ошибка сервера',
      error instanceof Error
        ? error.message
        : String(error),
      500
    )
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return configError()
    }

    const body = (
      await request
        .json()
        .catch(() => null)
    ) as Record<string, unknown> | null

    if (!body) {
      return NextResponse.json(
        {
          error:
            'Переданы неправильные данные заказа',
        },
        { status: 400 }
      )
    }

    const price = Number(
      body.price ?? 7000
    )

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          error:
            'Неправильно указана стоимость заказа',
        },
        { status: 400 }
      )
    }

    const serviceType =
      normalizeServiceType(
        body.service_type ??
          body.serviceType
      )

    const providerType =
      normalizeProviderType(
        body.provider_type ??
          body.providerType,
        serviceType
      )

    const row = {
      id: crypto.randomUUID(),
      problem: String(
        body.problem ||
          'Помощь на дороге'
      ).trim(),
      location: String(
        body.location || 'Астана'
      ).trim(),
      client: String(
        body.client || 'Ержан Т.'
      ).trim(),
      vehicle: String(
        body.vehicle ||
          'Toyota Prado 120'
      ).trim(),
      price,
      status: 'Новый заказ',
      master: null,
      service_type: serviceType,
      provider_type: providerType,
      cancelled_by: null,
      cancellation_reason: null,
      cancelled_at: null,
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/orders`,
      {
        method: 'POST',
        headers: supabaseHeaders({
          Prefer:
            'return=representation',
        }),
        body: JSON.stringify(row),
        cache: 'no-store',
      }
    )

    const data =
      await readJson(response)

    if (!response.ok) {
      return errorResponse(
        'Не удалось создать заказ',
        data,
        response.status
      )
    }

    const created = (
      Array.isArray(data)
        ? data[0]
        : data
    ) as DbOrder | undefined

    if (!created) {
      return NextResponse.json(
        {
          error:
            'Supabase не вернул созданный заказ',
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
      error instanceof Error
        ? error.message
        : String(error),
      500
    )
  }
}

export async function PATCH(
  request: NextRequest
) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return configError()
    }

    const body = (
      await request
        .json()
        .catch(() => null)
    ) as Record<string, unknown> | null

    if (!body) {
      return NextResponse.json(
        {
          error:
            'Переданы неправильные данные заказа',
        },
        { status: 400 }
      )
    }

    let id = body.id
      ? String(body.id)
      : ''

    if (!id) {
      const current =
        await findCurrentOrderId()

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

    const currentResult =
      await fetchOrderById(id)

    if (currentResult.error) {
      return currentResult.error
    }

    const currentOrder =
      currentResult.order

    if (!currentOrder) {
      return NextResponse.json(
        {
          error: 'Заказ не найден',
        },
        { status: 404 }
      )
    }

    if (
      terminalStatuses.has(
        currentOrder.status
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Завершённый или отменённый заказ нельзя изменить',
        },
        { status: 409 }
      )
    }

    const patch: OrderPatch = {}

    if (body.status !== undefined) {
      const nextStatus =
        normalizeStatus(body.status)

      if (!nextStatus) {
        return NextResponse.json(
          {
            error:
              'Неизвестный статус заказа',
          },
          { status: 400 }
        )
      }

      if (
        !canChangeStatus(
          currentOrder.status,
          nextStatus
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Нельзя перейти к этому статусу',
            details: {
              currentStatus:
                currentOrder.status,
              requestedStatus:
                nextStatus,
              allowedStatuses:
                statusTransitions[
                  currentOrder.status
                ],
            },
          },
          { status: 409 }
        )
      }

      patch.status = nextStatus
    }

    if (body.problem !== undefined) {
      patch.problem = String(
        body.problem
      ).trim()
    }

    if (body.location !== undefined) {
      patch.location = String(
        body.location
      ).trim()
    }

    if (body.client !== undefined) {
      patch.client = String(
        body.client
      ).trim()
    }

    if (body.vehicle !== undefined) {
      patch.vehicle = String(
        body.vehicle
      ).trim()
    }

    if (body.price !== undefined) {
      const price = Number(body.price)

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        return NextResponse.json(
          {
            error:
              'Неправильно указана стоимость заказа',
          },
          { status: 400 }
        )
      }

      patch.price = price
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
        currentOrder.master !==
          requestedMaster
      ) {
        return NextResponse.json(
          {
            error:
              'Заказ уже принят другим исполнителем',
          },
          { status: 409 }
        )
      }

      const requestedProviderType =
        normalizeProviderType(
          body.provider_type ??
            body.providerType ??
            currentOrder.provider_type,
          currentOrder.service_type
        )

      if (
        requestedMaster &&
        requestedProviderType !==
          currentOrder.provider_type
      ) {
        return NextResponse.json(
          {
            error:
              'Этот заказ предназначен другому типу исполнителя',
            details: {
              orderProviderType:
                currentOrder.provider_type,
              requestedProviderType,
            },
          },
          { status: 403 }
        )
      }

      if (
        requestedMaster &&
        currentOrder.status !==
          'Новый заказ'
      ) {
        return NextResponse.json(
          {
            error:
              'Принять можно только новый заказ',
          },
          { status: 409 }
        )
      }

      patch.master = requestedMaster
    }

    if (
      patch.status ===
        'Мастер принял заказ' &&
      !requestedMaster &&
      !currentOrder.master
    ) {
      return NextResponse.json(
        {
          error:
            'При принятии заказа необходимо указать исполнителя',
        },
        { status: 400 }
      )
    }

    if (
      patch.status &&
      patch.status !==
        'Мастер принял заказ' &&
      !currentOrder.master &&
      !requestedMaster
    ) {
      return NextResponse.json(
        {
          error:
            'Сначала исполнитель должен принять заказ',
        },
        { status: 409 }
      )
    }

    if (
      Object.keys(patch).length === 0
    ) {
      return NextResponse.json(
        {
          error:
            'Нет данных для изменения заказа',
        },
        { status: 400 }
      )
    }

    const params =
      new URLSearchParams()

    params.set('id', `eq.${id}`)

    if (
      requestedMaster &&
      !currentOrder.master
    ) {
      params.set(
        'master',
        'is.null'
      )
      params.set(
        'status',
        'eq.Новый заказ'
      )
    }

    const response = await fetch(
      buildOrdersUrl(params),
      {
        method: 'PATCH',
        headers: supabaseHeaders({
          Prefer:
            'return=representation',
        }),
        body: JSON.stringify(patch),
        cache: 'no-store',
      }
    )

    const data =
      await readJson(response)

    if (!response.ok) {
      return errorResponse(
        'Не удалось обновить заказ',
        data,
        response.status
      )
    }

    const updated = (
      Array.isArray(data)
        ? data[0]
        : data
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
      error instanceof Error
        ? error.message
        : String(error),
      500
    )
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return configError()
    }

    const body = (
      await request
        .json()
        .catch(() => ({}))
    ) as Record<string, unknown>

    let id = String(
      body.id ||
        request.nextUrl.searchParams.get(
          'id'
        ) ||
        ''
    )

    if (!id) {
      const current =
        await findCurrentOrderId()

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

    const currentResult =
      await fetchOrderById(id)

    if (currentResult.error) {
      return currentResult.error
    }

    const order =
      currentResult.order

    if (!order) {
      return NextResponse.json(
        {
          error: 'Заказ не найден',
        },
        { status: 404 }
      )
    }

    if (
      terminalStatuses.has(
        order.status
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Заказ уже завершён или отменён',
        },
        { status: 409 }
      )
    }

    const actor = String(
      body.actor ||
        request.nextUrl.searchParams.get(
          'actor'
        ) ||
        ''
    ).trim()

    const providerName = String(
      body.providerName ||
        body.provider_name ||
        request.nextUrl.searchParams.get(
          'providerName'
        ) ||
        order.master ||
        'Айбек Нурланов'
    ).trim()

    const reason = String(
      body.reason ||
        request.nextUrl.searchParams.get(
          'reason'
        ) ||
        'Причина не указана'
    ).trim()

    /*
     * Свободный новый заказ:
     * отказ исполнителя не отменяет заявку.
     */
    if (
      order.status ===
        'Новый заказ' &&
      !order.master &&
      actor !== 'client'
    ) {
      const rejectionError =
        await createRejection(
          order.id,
          providerName,
          order.provider_type
        )

      if (rejectionError) {
        return rejectionError
      }

      return NextResponse.json({
        rejected: true,
        order: toShared(order),
        message:
          'Заказ скрыт для этого исполнителя и остаётся доступным другим.',
      })
    }

    /*
     * Водитель или уже назначенный исполнитель
     * отменяет весь заказ.
     */
    const cancelledBy =
      actor === 'provider'
        ? 'provider'
        : actor === 'client'
          ? 'client'
          : order.master
            ? 'provider'
            : 'client'

    const params =
      new URLSearchParams()

    params.set('id', `eq.${id}`)

    const response = await fetch(
      buildOrdersUrl(params),
      {
        method: 'PATCH',
        headers: supabaseHeaders({
          Prefer:
            'return=representation',
        }),
        body: JSON.stringify({
          status: 'Отменён',
          cancelled_by: cancelledBy,
          cancellation_reason: reason,
          cancelled_at:
            new Date().toISOString(),
        }),
        cache: 'no-store',
      }
    )

    const data =
      await readJson(response)

    if (!response.ok) {
      return errorResponse(
        'Не удалось отменить заказ',
        data,
        response.status
      )
    }

    const cancelled = (
      Array.isArray(data)
        ? data[0]
        : data
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
      cancelled: true,
      order: toShared(cancelled),
    })
  } catch (error) {
    return errorResponse(
      'Внутренняя ошибка сервера',
      error instanceof Error
        ? error.message
        : String(error),
      500
    )
  }
}
