export type Tab = 'home' | 'map' | 'sto' | 'orders' | 'profile'

export type Stage = 'start' | 'searching' | 'result' | 'active'

export type OrderStatus =
  | 'Новый заказ'
  | 'Ищем мастера'
  | 'Мастер принял заказ'
  | 'Мастер едет'
  | 'Мастер прибыл'
  | 'Работа выполняется'
  | 'Нет свободных специалистов'
  | 'Завершён'
  | 'Отменён'

export type Problem = {
  id: string
  icon: string
  title: string
  hint: string
}

export type Master = {
  name: string
  role: string
  rating: string
  reviews: string
  eta: string
  distance: string
  price: string
  initials: string
  phone: string
  coords: [number, number]
}

export type Order = {
  id: string
  master: string
  problem: string
  location: string
  createdAt: string
  status: OrderStatus
}
