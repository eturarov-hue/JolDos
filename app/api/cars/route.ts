import { NextRequest, NextResponse } from 'next/server'

type DbCar = {
  id: string
  client: string
  make: string
  model: string
  year: number
  plate: string
  vin: string
  mileage: number
  engine: string
  transmission: string
  fuel: string
  created_at: string
  updated_at: string
}

type DbRecord = {
  id: string
  car_id: string
  client: string
  service_date: string
  mileage: number
  category: string
  description: string
  cost: number
  notes: string
  created_at: string
  updated_at: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '')
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function configError() {
  return NextResponse.json(
    {
      error: 'Supabase для автомобилей не настроен',
      details:
        'Добавьте SUPABASE_SERVICE_ROLE_KEY в Vercel Environment Variables.',
    },
    { status: 500 },
  )
}

function headers(extra: Record<string, string> = {}) {
  if (!supabaseKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')
  }

  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    ...extra,
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

function fail(error: string, details: unknown, status: number) {
  return NextResponse.json({ error, details }, { status })
}

function cleanText(value: unknown) {
  return String(value ?? '').trim()
}

function cleanNumber(value: unknown, fallback = 0) {
  const number = Number(value)

  if (!Number.isFinite(number) || number < 0) {
    return fallback
  }

  return number
}

function carToClient(row: DbCar) {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: String(row.year),
    plate: row.plate,
    vin: row.vin,
    mileage: String(row.mileage),
    engine: row.engine,
    transmission: row.transmission,
    fuel: row.fuel,
    createdAt: row.created_at,
  }
}

function recordToClient(row: DbRecord) {
  return {
    id: row.id,
    carId: row.car_id,
    date: row.service_date,
    mileage: String(row.mileage),
    category: row.category,
    description: row.description,
    cost: String(Number(row.cost)),
    notes: row.notes,
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return configError()
    }

    const client = cleanText(
      request.nextUrl.searchParams.get('client') || 'Ержан Т.',
    )

    const carsParams = new URLSearchParams()
    carsParams.set('select', '*')
    carsParams.set('client', `eq.${client}`)
    carsParams.set('order', 'created_at.asc')

    const recordsParams = new URLSearchParams()
    recordsParams.set('select', '*')
    recordsParams.set('client', `eq.${client}`)
    recordsParams.set('order', 'service_date.desc,created_at.desc')

    const [carsResponse, recordsResponse] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/cars?${carsParams.toString()}`, {
        headers: headers(),
        cache: 'no-store',
      }),
      fetch(
        `${supabaseUrl}/rest/v1/car_service_records?${recordsParams.toString()}`,
        {
          headers: headers(),
          cache: 'no-store',
        },
      ),
    ])

    const [carsData, recordsData] = await Promise.all([
      readJson(carsResponse),
      readJson(recordsResponse),
    ])

    if (!carsResponse.ok) {
      return fail(
        'Не удалось загрузить автомобили',
        carsData,
        carsResponse.status,
      )
    }

    if (!recordsResponse.ok) {
      return fail(
        'Не удалось загрузить историю обслуживания',
        recordsData,
        recordsResponse.status,
      )
    }

    const cars = (Array.isArray(carsData) ? carsData : []) as DbCar[]
    const records = (Array.isArray(recordsData) ? recordsData : []) as DbRecord[]

    return NextResponse.json(
      {
        cars: cars.map(carToClient),
        records: records.map(recordToClient),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    )
  } catch (error) {
    return fail(
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
        { error: 'Переданы неправильные данные' },
        { status: 400 },
      )
    }

    const resource = cleanText(body.resource)
    const client = cleanText(body.client || 'Ержан Т.')

    if (resource === 'car') {
      const make = cleanText(body.make)
      const model = cleanText(body.model)
      const year = cleanNumber(body.year)

      if (!make || !model || !year) {
        return NextResponse.json(
          { error: 'Укажите марку, модель и год автомобиля' },
          { status: 400 },
        )
      }

      const row = {
        client,
        make,
        model,
        year,
        plate: cleanText(body.plate),
        vin: cleanText(body.vin),
        mileage: cleanNumber(body.mileage),
        engine: cleanText(body.engine),
        transmission: cleanText(body.transmission),
        fuel: cleanText(body.fuel),
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/cars`, {
        method: 'POST',
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify(row),
        cache: 'no-store',
      })

      const data = await readJson(response)

      if (!response.ok) {
        return fail('Не удалось сохранить автомобиль', data, response.status)
      }

      const created = (
        Array.isArray(data) ? data[0] : data
      ) as DbCar | undefined

      if (!created) {
        return NextResponse.json(
          { error: 'Supabase не вернул автомобиль' },
          { status: 500 },
        )
      }

      return NextResponse.json(
        { car: carToClient(created) },
        { status: 201 },
      )
    }

    if (resource === 'record') {
      const carId = cleanText(body.carId)
      const date = cleanText(body.date)
      const description = cleanText(body.description)

      if (!carId || !date || !description) {
        return NextResponse.json(
          { error: 'Укажите автомобиль, дату и выполненную работу' },
          { status: 400 },
        )
      }

      const carParams = new URLSearchParams()
      carParams.set('select', 'id')
      carParams.set('id', `eq.${carId}`)
      carParams.set('client', `eq.${client}`)
      carParams.set('limit', '1')

      const carResponse = await fetch(
        `${supabaseUrl}/rest/v1/cars?${carParams.toString()}`,
        {
          headers: headers(),
          cache: 'no-store',
        },
      )

      const carData = await readJson(carResponse)

      if (!carResponse.ok) {
        return fail(
          'Не удалось проверить автомобиль',
          carData,
          carResponse.status,
        )
      }

      if (!Array.isArray(carData) || carData.length === 0) {
        return NextResponse.json(
          { error: 'Автомобиль не найден' },
          { status: 404 },
        )
      }

      const row = {
        car_id: carId,
        client,
        service_date: date,
        mileage: cleanNumber(body.mileage),
        category: cleanText(body.category || 'Другое'),
        description,
        cost: cleanNumber(body.cost),
        notes: cleanText(body.notes),
      }

      const response = await fetch(
        `${supabaseUrl}/rest/v1/car_service_records`,
        {
          method: 'POST',
          headers: headers({ Prefer: 'return=representation' }),
          body: JSON.stringify(row),
          cache: 'no-store',
        },
      )

      const data = await readJson(response)

      if (!response.ok) {
        return fail(
          'Не удалось добавить запись обслуживания',
          data,
          response.status,
        )
      }

      const created = (
        Array.isArray(data) ? data[0] : data
      ) as DbRecord | undefined

      if (!created) {
        return NextResponse.json(
          { error: 'Supabase не вернул запись обслуживания' },
          { status: 500 },
        )
      }

      return NextResponse.json(
        { record: recordToClient(created) },
        { status: 201 },
      )
    }

    return NextResponse.json(
      { error: 'Неизвестный тип данных' },
      { status: 400 },
    )
  } catch (error) {
    return fail(
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
        { error: 'Переданы неправильные данные' },
        { status: 400 },
      )
    }

    const resource = cleanText(body.resource)
    const id = cleanText(body.id)
    const client = cleanText(body.client || 'Ержан Т.')

    if (resource !== 'car' || !id) {
      return NextResponse.json(
        { error: 'Автомобиль не найден' },
        { status: 404 },
      )
    }

    const make = cleanText(body.make)
    const model = cleanText(body.model)
    const year = cleanNumber(body.year)

    if (!make || !model || !year) {
      return NextResponse.json(
        { error: 'Укажите марку, модель и год автомобиля' },
        { status: 400 },
      )
    }

    const params = new URLSearchParams()
    params.set('id', `eq.${id}`)
    params.set('client', `eq.${client}`)

    const response = await fetch(
      `${supabaseUrl}/rest/v1/cars?${params.toString()}`,
      {
        method: 'PATCH',
        headers: headers({ Prefer: 'return=representation' }),
        body: JSON.stringify({
          make,
          model,
          year,
          plate: cleanText(body.plate),
          vin: cleanText(body.vin),
          mileage: cleanNumber(body.mileage),
          engine: cleanText(body.engine),
          transmission: cleanText(body.transmission),
          fuel: cleanText(body.fuel),
          updated_at: new Date().toISOString(),
        }),
        cache: 'no-store',
      },
    )

    const data = await readJson(response)

    if (!response.ok) {
      return fail('Не удалось изменить автомобиль', data, response.status)
    }

    const updated = (
      Array.isArray(data) ? data[0] : data
    ) as DbCar | undefined

    if (!updated) {
      return NextResponse.json(
        { error: 'Автомобиль не найден' },
        { status: 404 },
      )
    }

    return NextResponse.json({ car: carToClient(updated) })
  } catch (error) {
    return fail(
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

    const resource = cleanText(
      request.nextUrl.searchParams.get('resource'),
    )
    const id = cleanText(request.nextUrl.searchParams.get('id'))
    const client = cleanText(
      request.nextUrl.searchParams.get('client') || 'Ержан Т.',
    )

    if (!id || !['car', 'record'].includes(resource)) {
      return NextResponse.json(
        { error: 'Данные не найдены' },
        { status: 404 },
      )
    }

    const table =
      resource === 'car' ? 'cars' : 'car_service_records'

    const params = new URLSearchParams()
    params.set('id', `eq.${id}`)
    params.set('client', `eq.${client}`)

    const response = await fetch(
      `${supabaseUrl}/rest/v1/${table}?${params.toString()}`,
      {
        method: 'DELETE',
        headers: headers({ Prefer: 'return=representation' }),
        cache: 'no-store',
      },
    )

    const data = await readJson(response)

    if (!response.ok) {
      return fail('Не удалось удалить данные', data, response.status)
    }

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Данные не найдены' },
        { status: 404 },
      )
    }

    return NextResponse.json({ ok: true, id })
  } catch (error) {
    return fail(
      'Внутренняя ошибка сервера',
      error instanceof Error ? error.message : String(error),
      500,
    )
  }
}
