export type ServiceId =
  | 'tow'
  | 'jump_start'
  | 'wheel_change'
  | 'fuel_delivery'
  | 'car_unlock'
  | 'road_assistance'
  | 'starter'
  | 'generator'
  | 'electrical_diagnostics'
  | 'car_wash'
  | 'service_station'

export type ServiceProviderType =
  | 'tow_truck'
  | 'master'
  | 'electrician'
  | 'tire_service'
  | 'fuel_delivery'
  | 'locksmith'
  | 'car_wash'
  | 'service_station'

export type ServiceDefinition = {
  id: ServiceId
  problemId: string
  serviceType: string
  providerTypes: ServiceProviderType[]
  icon: string
  title: {
    ru: string
    kk: string
    en: string
  }
  description: {
    ru: string
    kk: string
    en: string
  }
  priceFrom: number | null
  estimatedMinutes: number | null
}

export const SERVICES: Record<ServiceId, ServiceDefinition> = {
  tow: {
    id: 'tow',
    problemId: 'tow',
    serviceType: 'tow_truck',
    providerTypes: ['tow_truck'],
    icon: '🚛',
    title: {
      ru: 'Эвакуатор',
      kk: 'Эвакуатор',
      en: 'Tow truck',
    },
    description: {
      ru: 'Перевозка автомобиля и помощь после ДТП',
      kk: 'Автокөлікті тасымалдау және ЖКО-дан кейінгі көмек',
      en: 'Vehicle transport and accident recovery',
    },
    priceFrom: 5000,
    estimatedMinutes: 40,
  },

  jump_start: {
    id: 'jump_start',
    problemId: 'start',
    serviceType: 'battery',
    providerTypes: ['master', 'electrician'],
    icon: '🔋',
    title: {
      ru: 'Прикурить аккумулятор',
      kk: 'Аккумуляторды іске қосу',
      en: 'Jump-start battery',
    },
    description: {
      ru: 'Запуск двигателя от внешнего источника питания',
      kk: 'Қозғалтқышты сыртқы қуат көзінен іске қосу',
      en: 'Start the engine using an external power source',
    },
    priceFrom: 2000,
    estimatedMinutes: 20,
  },

  wheel_change: {
    id: 'wheel_change',
    problemId: 'wheel',
    serviceType: 'tire_service',
    providerTypes: ['tire_service'],
    icon: '🛞',
    title: {
      ru: 'Замена колеса',
      kk: 'Дөңгелек ауыстыру',
      en: 'Wheel replacement',
    },
    description: {
      ru: 'Замена повреждённого колеса или ремонт прокола',
      kk: 'Зақымдалған дөңгелекті ауыстыру немесе тесікті жөндеу',
      en: 'Replace a damaged wheel or repair a puncture',
    },
    priceFrom: 2500,
    estimatedMinutes: 30,
  },

  fuel_delivery: {
    id: 'fuel_delivery',
    problemId: 'fuel',
    serviceType: 'fuel_delivery',
    providerTypes: ['master', 'fuel_delivery'],
    icon: '⛽',
    title: {
      ru: 'Доставка топлива',
      kk: 'Жанармай жеткізу',
      en: 'Fuel delivery',
    },
    description: {
      ru: 'Подвоз топлива к месту остановки автомобиля',
      kk: 'Автокөлік тоқтаған жерге жанармай жеткізу',
      en: 'Deliver fuel to the stopped vehicle',
    },
    priceFrom: 3000,
    estimatedMinutes: 35,
  },

  car_unlock: {
    id: 'car_unlock',
    problemId: 'other',
    serviceType: 'car_unlock',
    providerTypes: ['master', 'locksmith'],
    icon: '🔐',
    title: {
      ru: 'Вскрытие автомобиля',
      kk: 'Автокөлікті ашу',
      en: 'Car unlocking',
    },
    description: {
      ru: 'Безопасное открытие автомобиля без повреждений',
      kk: 'Автокөлікті зақымдамай қауіпсіз ашу',
      en: 'Open the vehicle safely without damage',
    },
    priceFrom: 3000,
    estimatedMinutes: 25,
  },

  road_assistance: {
    id: 'road_assistance',
    problemId: 'other',
    serviceType: 'road_assistance',
    providerTypes: ['master'],
    icon: '🔧',
    title: {
      ru: 'Техпомощь на месте',
      kk: 'Жолдағы техкөмек',
      en: 'Roadside assistance',
    },
    description: {
      ru: 'Диагностика и мелкий ремонт на дороге',
      kk: 'Жолда диагностика және шағын жөндеу',
      en: 'Diagnostics and minor roadside repair',
    },
    priceFrom: 3000,
    estimatedMinutes: 45,
  },

  starter: {
    id: 'starter',
    problemId: 'start',
    serviceType: 'starter',
    providerTypes: ['electrician'],
    icon: '⚡',
    title: {
      ru: 'Не работает стартер',
      kk: 'Стартер жұмыс істемейді',
      en: 'Starter problem',
    },
    description: {
      ru: 'Диагностика и ремонт стартера',
      kk: 'Стартерді диагностикалау және жөндеу',
      en: 'Starter diagnostics and repair',
    },
    priceFrom: 7000,
    estimatedMinutes: 60,
  },

  generator: {
    id: 'generator',
    problemId: 'start',
    serviceType: 'generator',
    providerTypes: ['electrician'],
    icon: '⚙️',
    title: {
      ru: 'Проблема с генератором',
      kk: 'Генератор ақауы',
      en: 'Alternator problem',
    },
    description: {
      ru: 'Диагностика зарядки и ремонт генератора',
      kk: 'Зарядтау жүйесін диагностикалау және генераторды жөндеу',
      en: 'Charging-system diagnostics and alternator repair',
    },
    priceFrom: 8000,
    estimatedMinutes: 75,
  },

  electrical_diagnostics: {
    id: 'electrical_diagnostics',
    problemId: 'other',
    serviceType: 'electrical_diagnostics',
    providerTypes: ['electrician'],
    icon: '🧰',
    title: {
      ru: 'Диагностика электрики',
      kk: 'Электр жүйесін диагностикалау',
      en: 'Electrical diagnostics',
    },
    description: {
      ru: 'Проверка проводки, предохранителей и электронных систем',
      kk: 'Сымдарды, сақтандырғыштарды және электрондық жүйелерді тексеру',
      en: 'Check wiring, fuses, and electronic systems',
    },
    priceFrom: 5000,
    estimatedMinutes: 50,
  },

  car_wash: {
    id: 'car_wash',
    problemId: 'other',
    serviceType: 'car_wash',
    providerTypes: ['car_wash'],
    icon: '🧼',
    title: {
      ru: 'Автомойка',
      kk: 'Автожуу',
      en: 'Car wash',
    },
    description: {
      ru: 'Мойка автомобиля на выезде или в сервисе',
      kk: 'Автокөлікті көшпелі немесе сервисте жуу',
      en: 'Mobile or service-center car wash',
    },
    priceFrom: 3000,
    estimatedMinutes: 40,
  },

  service_station: {
    id: 'service_station',
    problemId: 'other',
    serviceType: 'service_station',
    providerTypes: ['service_station'],
    icon: '🏢',
    title: {
      ru: 'СТО и ремонт',
      kk: 'СТО және жөндеу',
      en: 'Service and repair',
    },
    description: {
      ru: 'Ремонт автомобиля в стационарном сервисе',
      kk: 'Автокөлікті стационарлық сервисте жөндеу',
      en: 'Vehicle repair at a service center',
    },
    priceFrom: null,
    estimatedMinutes: null,
  },
}

export const SERVICE_LIST: ServiceDefinition[] =
  Object.values(SERVICES)

export function getService(
  id: string | null | undefined,
): ServiceDefinition | null {
  if (id && id in SERVICES) {
    return SERVICES[id as ServiceId]
  }

  return null
}

export function getServicesForProvider(
  providerType: ServiceProviderType,
): ServiceDefinition[] {
  return SERVICE_LIST.filter(service =>
    service.providerTypes.includes(providerType),
  )
}
