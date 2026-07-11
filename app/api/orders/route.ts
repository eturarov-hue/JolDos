import { NextResponse } from 'next/server'

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

declare global { var joldosOrder: SharedOrder | null | undefined }

const readOrder = () => globalThis.joldosOrder ?? null

export async function GET(){
  return NextResponse.json({ order: readOrder() }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request){
  const body = await request.json()
  const order: SharedOrder = {
    id: String(Date.now()),
    problem: String(body.problem || 'Помощь на дороге'),
    location: String(body.location || 'Астана'),
    client: String(body.client || 'Ержан Т.'),
    vehicle: String(body.vehicle || 'Toyota Prado 120'),
    price: Number(body.price || 7000),
    status: 'Новый заказ',
    createdAt: new Date().toISOString(),
  }
  globalThis.joldosOrder = order
  return NextResponse.json({ order })
}

export async function PATCH(request: Request){
  const current = readOrder()
  if(!current) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 })
  const body = await request.json()
  globalThis.joldosOrder = { ...current, ...body }
  return NextResponse.json({ order: globalThis.joldosOrder })
}

export async function DELETE() {
  const current = readOrder()

  if (!current) {
    return NextResponse.json(
      { error: 'Заказ не найден' },
      { status: 404 }
    )
  }

  globalThis.joldosOrder = {
    ...current,
    status: 'Отменён'
  }

  return NextResponse.json({
    order: globalThis.joldosOrder
  })
}
