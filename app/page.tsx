'use client'

import { useRouter } from 'next/navigation'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { dict, tr, useLanguage } from '@/lib/i18n'

type TestUser = {
  id: string
  name: string
  role: 'client' | 'master' | 'partner'
  providerType?: string
  route: string
  icon: string
  description: {
    ru: string
    kk: string
    en: string
  }
}

const testUsers: TestUser[] = [
  {
    id: 'driver_test',
    name: 'Водитель TEST',
    role: 'client',
    route: '/client',
    icon: '🚗',
    description: {
      ru: 'Создание и контроль заказов',
      kk: 'Тапсырыстарды құру және бақылау',
      en: 'Create and manage orders',
    },
  },
  {
    id: 'master_test_1',
    name: 'Мастер TEST 1',
    role: 'master',
    providerType: 'master',
    route: '/master',
    icon: '🧰',
    description: {
      ru: 'Первый тестовый мастер',
      kk: 'Бірінші сынақ шебері',
      en: 'First test specialist',
    },
  },
  {
    id: 'master_test_2',
    name: 'Мастер TEST 2',
    role: 'master',
    providerType: 'master',
    route: '/master',
    icon: '🔧',
    description: {
      ru: 'Второй тестовый мастер',
      kk: 'Екінші сынақ шебері',
      en: 'Second test specialist',
    },
  },
  {
    id: 'master_test_3',
    name: 'Мастер TEST 3',
    role: 'master',
    providerType: 'master',
    route: '/master',
    icon: '🛠️',
    description: {
      ru: 'Третий тестовый мастер',
      kk: 'Үшінші сынақ шебері',
      en: 'Third test specialist',
    },
  },
  {
    id: 'partner_test',
    name: 'СТО TEST',
    role: 'partner',
    providerType: 'service_station',
    route: '/partner',
    icon: '🏢',
    description: {
      ru: 'Тестовый аккаунт организации',
      kk: 'Ұйымның сынақ аккаунты',
      en: 'Test organization account',
    },
  },
]

export default function Portal() {
  const { lang, setLang } = useLanguage()
  const router = useRouter()
  const p = dict.portal

  function enterAs(user: TestUser) {
    try {
      localStorage.setItem(
        'joldos-test-user',
        JSON.stringify({
          id: user.id,
          name: user.name,
          role: user.role,
          providerType: user.providerType ?? null,
        }),
      )
    } catch {
      // Переход всё равно должен работать,
      // даже если localStorage недоступен.
    }

    router.push(user.route)
  }

  return (
    <main className="portal-shell">
      <div className="portal-card">
        <LanguageSwitcher lang={lang} onChange={setLang} />

        <img src="/joldos-logo.png" alt="JolDos" />

        <p>{tr(p.subtitle, lang)}</p>
        <h1>{tr(p.title, lang)}</h1>

        <div className="portal-grid three">
          {testUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => enterAs(user)}
              style={{
                width: '100%',
                border: 0,
                cursor: 'pointer',
                textAlign: 'left',
                font: 'inherit',
              }}
            >
              <b>
                {user.icon} {user.name}
              </b>

              <span>{user.description[lang]}</span>
            </button>
          ))}
        </div>

        <small>
          {lang === 'kk'
            ? 'Сынақ режимі: тіркеусіз пайдаланушыны таңдаңыз'
            : lang === 'en'
              ? 'Test mode: select a user without registration'
              : 'Тестовый режим: выберите пользователя без регистрации'}
        </small>
      </div>
    </main>
  )
}
