export type TestMasterId =
  | 'master_aibek'
  | 'master_nurlan'
  | 'master_sanzhar'
  | 'master_dias'

export type TestMasterProviderType =
  | 'tire_service'
  | 'master'
  | 'electrician'
  | 'tow_truck'

export type TestMaster = {
  id: TestMasterId
  name: string
  fullName: string
  initials: string
  providerType: TestMasterProviderType
  title: {
    ru: string
    kk: string
    en: string
  }
  specialties: {
    icon: string
    ru: string
    kk: string
    en: string
  }[]
}

export const TEST_MASTERS: Record<TestMasterId, TestMaster> = {
  master_aibek: {
    id: 'master_aibek',
    name: 'Айбек',
    fullName: 'Айбек',
    initials: 'А',
    providerType: 'tire_service',
    title: {
      ru: 'Выездной шиномонтаж',
      kk: 'Көшпелі шиномонтаж',
      en: 'Mobile tire service',
    },
    specialties: [
      {
        icon: '🛞',
        ru: 'Выездной шиномонтаж',
        kk: 'Көшпелі шиномонтаж',
        en: 'Mobile tire service',
      },
      {
        icon: '🔧',
        ru: 'Ремонт проколов',
        kk: 'Тесілген дөңгелекті жөндеу',
        en: 'Puncture repair',
      },
      {
        icon: '🛞',
        ru: 'Замена колёс',
        kk: 'Дөңгелек ауыстыру',
        en: 'Wheel replacement',
      },
    ],
  },

  master_nurlan: {
    id: 'master_nurlan',
    name: 'Нурлан',
    fullName: 'Нурлан',
    initials: 'Н',
    providerType: 'master',
    title: {
      ru: 'Техпомощь на дороге',
      kk: 'Жолдағы техникалық көмек',
      en: 'Roadside assistance',
    },
    specialties: [
      {
        icon: '🚗',
        ru: 'Техпомощь на дороге',
        kk: 'Жолдағы техникалық көмек',
        en: 'Roadside assistance',
      },
      {
        icon: '🔋',
        ru: 'Запуск аккумулятора',
        kk: 'Аккумуляторды іске қосу',
        en: 'Battery jump-start',
      },
      {
        icon: '⛽',
        ru: 'Доставка топлива',
        kk: 'Жанармай жеткізу',
        en: 'Fuel delivery',
      },
    ],
  },

  master_sanzhar: {
    id: 'master_sanzhar',
    name: 'Санжар',
    fullName: 'Санжар',
    initials: 'С',
    providerType: 'electrician',
    title: {
      ru: 'Автоэлектрик',
      kk: 'Автоэлектрик',
      en: 'Auto electrician',
    },
    specialties: [
      {
        icon: '⚡',
        ru: 'Автоэлектрика',
        kk: 'Автоэлектрика',
        en: 'Auto electrics',
      },
      {
        icon: '🔋',
        ru: 'Стартер и аккумулятор',
        kk: 'Стартер және аккумулятор',
        en: 'Starter and battery',
      },
      {
        icon: '⚙️',
        ru: 'Генератор и диагностика',
        kk: 'Генератор және диагностика',
        en: 'Alternator and diagnostics',
      },
    ],
  },

  master_dias: {
    id: 'master_dias',
    name: 'Диас',
    fullName: 'Диас',
    initials: 'Д',
    providerType: 'tow_truck',
    title: {
      ru: 'Водитель эвакуатора',
      kk: 'Эвакуатор жүргізушісі',
      en: 'Tow truck driver',
    },
    specialties: [
      {
        icon: '🚛',
        ru: 'Эвакуатор',
        kk: 'Эвакуатор',
        en: 'Tow truck',
      },
      {
        icon: '🚙',
        ru: 'Перевозка автомобиля',
        kk: 'Автокөлікті тасымалдау',
        en: 'Vehicle transport',
      },
      {
        icon: '⚠️',
        ru: 'Эвакуация после ДТП',
        kk: 'ЖКО-дан кейін эвакуациялау',
        en: 'Accident recovery',
      },
    ],
  },
}

export const TEST_MASTER_LIST: TestMaster[] =
  Object.values(TEST_MASTERS)

export const DEFAULT_TEST_MASTER: TestMaster =
  TEST_MASTERS.master_aibek

export function getTestMaster(
  id: string | null | undefined,
): TestMaster {
  if (id && id in TEST_MASTERS) {
    return TEST_MASTERS[id as TestMasterId]
  }

  return DEFAULT_TEST_MASTER
}
