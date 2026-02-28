# BetCo TypeScript SDK — Codebase Reference

> Документ для AI-ассистентов и разработчиков. Описывает архитектуру, все методы и паттерны добавления нового функционала.

---

## Обзор

TypeScript SDK для работы с BetConstruct BackOffice API, Affiliates API и CRM API.
Порт оригинального PHP SDK (`ggl/betco-php-sdk`).

**Стек:** Node.js, TypeScript, axios, cheerio (парсинг HTML для OAuth)
**Зависимости:** `npm install` в папке `betco-ts-sdk`

---

## Структура проекта

```
betco-ts-sdk/
├── src/
│   ├── index.ts                        ← точка входа, реэкспорт всего публичного
│   ├── server.ts                       ← HTTP сервер (RPC endpoint для ботов)
│   ├── Credentials.ts                  ← хранение логина/пароля/2FA секрета
│   ├── GoogleAuth.ts                   ← TOTP генерация кода (2FA)
│   ├── utils.ts                        ← parseSetCookies, buildCookieHeader
│   │
│   ├── clients/
│   │   ├── BetsConstructClient.ts      ← ГЛАВНЫЙ клиент (BackOffice)
│   │   ├── AffiliatesClient.ts         ← клиент для Affiliates API
│   │   ├── CRMClient.ts                ← клиент для CRM API
│   │   ├── IBetsConstructClient.ts     ← интерфейс (избежание циклических импортов)
│   │   ├── IAffiliatesClient.ts        ← интерфейс
│   │   └── ICRMClient.ts               ← интерфейс
│   │
│   ├── actions/                        ← действия BackOffice API
│   │   ├── BaseAction.ts               ← базовый класс: sendRequest(), ensureAuthenticated()
│   │   ├── Reports.ts                  ← отчёты
│   │   ├── Users.ts                    ← пользователи
│   │   ├── Bonuses.ts                  ← бонусы
│   │   ├── Financials.ts               ← финансы/транзакции
│   │   ├── Settings.ts                 ← настройки аккаунта
│   │   └── PromoCodes.ts               ← промокоды
│   │
│   ├── affiliatesActions/              ← действия Affiliates API
│   │   ├── BaseAffiliatesAction.ts     ← базовый класс для Affiliates
│   │   └── Players.ts                  ← игроки
│   │
│   ├── crmActions/                     ← действия CRM API
│   │   ├── BaseCRMAction.ts            ← базовый класс для CRM
│   │   └── Segments.ts                 ← сегменты
│   │
│   ├── enums/
│   │   ├── BonusType.ts                ← типы бонусов (числовые значения)
│   │   └── PaymentDocumentType.ts      ← типы платёжных документов
│   │
│   ├── constants/
│   │   └── HttpMethod.ts               ← GET, POST, PUT, etc.
│   │
│   └── exceptions/
│       ├── BetsConstructException.ts         ← базовый класс ошибок
│       ├── BetsConstructAuthException.ts     ← ошибки аутентификации
│       ├── BetsConstructRequestException.ts  ← ошибки HTTP запросов (4xx/5xx)
│       └── BetsConstructLogicException.ts    ← ошибки логики (неверные параметры)
│
├── Dockerfile                          ← образ для Docker
├── .env.example                        ← шаблон переменных окружения
├── .gitignore
├── package.json
├── tsconfig.json
└── codebase.md (этот файл)
```

---

## Установка и запуск

```bash
cd betco-ts-sdk
npm install
npm run build      # компиляция TS → JS в /dist
npm run dev        # watch mode
npm start          # запустить HTTP сервер (dist/server.js)
```

Боты обращаются к SDK через HTTP (см. раздел **HTTP сервер**). SDK не импортируется в боты напрямую — один сервер на все боты.

---

## HTTP сервер (src/server.ts)

**Файл:** `src/server.ts`

Позволяет запустить SDK как отдельный HTTP-сервис и обращаться к нему из любого проекта/контейнера по HTTP. Один залогиненный клиент на весь сервер — логинится один раз.

### Переменные окружения

| Переменная | Описание |
|---|---|
| `BC_EMAIL` | Логин BackOffice |
| `BC_PASSWORD` | Пароль BackOffice |
| `BC_TOTP_SECRET` | Base32 TOTP секрет (2FA) |
| `AFFILIATES_URL` | URL Affiliates API |
| `CRM_URL` | URL CRM API (опционально) |
| `PORT` | Порт сервера (по умолчанию `3000`) |

### Эндпоинты

| Метод | Путь | Описание |
|---|---|---|
| `POST` | `/rpc` | Вызов любого метода SDK |
| `GET` | `/health` | Проверка доступности сервера |

### Формат запроса /rpc

```json
{
  "method": "users.get",
  "params": { "userId": 12345 }
}
```

Ответ при успехе:
```json
{ "ok": true, "result": { ... } }
```

Ответ при ошибке:
```json
{ "ok": false, "error": "описание ошибки", "code": null }
```

### Все доступные method

| method | params |
|---|---|
| `users.get` | `{ userId }` |
| `users.getKPI` | `{ userId }` |
| `users.update` | `{ userId, data }` |
| `users.updatePassword` | `{ userId, password }` |
| `users.getAccounts` | `{ userId }` |
| `users.getBonuses` | `{ clientId, params? }` |
| `users.createPaymentDocument` | `{ clientId, currency, amount, type, params? }` |
| `users.attachBonus` | `{ clientId, bonusId, amount, type, params? }` |
| `users.search` | `{ Email?, MaxRows?, SkeepRows?, ... }` |
| `users.updateClientDetails` | `{ ...поля клиента }` |
| `reports.getBets` | `{ filterBet: { ... } }` |
| `reports.getTurnOverReport` | `{ StartTimeLocal, EndTimeLocal, ... }` |
| `reports.getBonusReport` | `{ ... }` |
| `bonuses.getList` | `{ partnerId?, params? }` |
| `financials.getTransactions` | `{ ... }` |
| `settings.getSettings` | `{}` |
| `settings.saveSetting` | `{ ... }` |
| `promoCodes.getClientPromoCodes` | `{ Code?, ... }` |
| `promoCodes.create` | `{ Code, BonusId, ... }` |
| `affiliates.players.get` | `{ start?, limit?, ... }` |
| `affiliates.players.attachPlayerToRefId` | `{ ... }` |
| `crm.segments.update` | `{ segmentId, params? }` |
| `client.changeActiveProject` | `{ projectId }` |
| `client.withPreSelectedPartnerId` | `{}` |

### Docker Compose (два контейнера)

Структура папок:
```
projects/
├── betco-ts-sdk/      ← SDK + сервер
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── bot/               ← твой бот
└── docker-compose.yml
```

`docker-compose.yml`:
```yaml
version: '3.9'

services:
  sdk:
    build: ./betco-ts-sdk
    environment:
      BC_EMAIL: "your@email.com"
      BC_PASSWORD: "your_password"
      BC_TOTP_SECRET: "BASE32SECRET"
      AFFILIATES_URL: "https://xyz.affiliates.betconstruct.com"
    restart: unless-stopped

  bot:
    build: ./bot
    environment:
      SDK_URL: "http://sdk:3000"
      BOT_TOKEN: "telegram_token"
    depends_on:
      - sdk
    restart: unless-stopped
```

`Dockerfile` для SDK:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Клиент в боте (sdk-client.ts)

```typescript
const SDK_URL = process.env.SDK_URL ?? 'http://localhost:3000';

async function rpc<T = any>(method: string, params?: Record<string, any>): Promise<T> {
    const res = await fetch(`${SDK_URL}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? 'SDK error');
    return data.result;
}

export const sdk = {
    users: {
        get: (userId: number)                        => rpc('users.get', { userId }),
        search: (params: any)                        => rpc('users.search', params),
        getAccounts: (userId: number)                => rpc('users.getAccounts', { userId }),
        getBonuses: (clientId: number, params?: any) => rpc('users.getBonuses', { clientId, params }),
        deposit: (clientId: number, currency: string, amount: number, params?: any) =>
            rpc('users.createPaymentDocument', { clientId, currency, amount, type: 2, params }),
        attachBonus: (clientId: number, bonusId: number, amount: number, type: number) =>
            rpc('users.attachBonus', { clientId, bonusId, amount, type }),
    },
    reports: {
        getBets: (params: any)     => rpc('reports.getBets', params),
        getTurnOver: (params: any) => rpc('reports.getTurnOverReport', params),
    },
    promoCodes: {
        create: (params: any)      => rpc('promoCodes.create', params),
        getUsage: (params?: any)   => rpc('promoCodes.getClientPromoCodes', params),
    },
    affiliates: {
        getPlayers: (params?: any) => rpc('affiliates.players.get', params),
    },
};
```

---

## Клиенты

### BetsConstructClient (основной — BackOffice)

**Файл:** `src/clients/BetsConstructClient.ts`

```typescript
import { BetsConstructClient, Credentials } from 'betco-ts-sdk';

const client = new BetsConstructClient(
    new Credentials('email@example.com', 'password', 'TOTP_SECRET_BASE32'),
    true // reauthenticateAutomatically (по умолчанию true)
);

// Всё async — обязательно await
const user = await client.users().get(12345);
const bets = await client.reports().getBets({ ... });
```

**Методы клиента:**
| Метод | Описание |
|---|---|
| `users()` | Возвращает объект Users actions |
| `reports()` | Возвращает объект Reports actions |
| `bonuses()` | Возвращает объект Bonuses actions |
| `financials()` | Возвращает объект Financials actions |
| `settings()` | Возвращает объект Settings actions |
| `promoCodes()` | Возвращает объект PromoCodes actions |
| `authenticate()` | Принудительная авторизация (3 шага) |
| `ensureAuthenticated()` | Проверить сессию, авторизовать если нужно |
| `withPreSelectedPartnerId()` | Загрузить и запомнить текущий partnerId |
| `changeActiveProject(id)` | Сменить активный проект |
| `getSession()` | Экспорт сессии для кеша |
| `setSession(cookies, expiresAt)` | Восстановить сессию из кеша |
| `getAuthCookies()` | Получить текущие cookies авторизации |
| `getPartnerId()` | Получить текущий partnerId |

---

### AffiliatesClient

**Файл:** `src/clients/AffiliatesClient.ts`

```typescript
import { AffiliatesClient } from 'betco-ts-sdk';

const affiliates = new AffiliatesClient(
    client,                              // BetsConstructClient (нужен для auth)
    'https://xyz.affiliates.betconstruct.com',
);

const players = await affiliates.players().get({ start: 0, limit: 50 });
```

**Авторизация:** использует BetsConstructClient → CheckAuthentication → signInFromBetconstruct

---

### CRMClient

**Файл:** `src/clients/CRMClient.ts`

```typescript
import { CRMClient } from 'betco-ts-sdk';

const crm = new CRMClient(
    client,                              // BetsConstructClient
    'https://crm-t.betconstruct.com',   // по умолчанию
);

await crm.segments().update(42, { ... });
```

**Авторизация:** использует BetsConstructClient → CheckAuthentication → LoginWithPlatform → токен из `Data`

---

## Аутентификация (детали)

### BetsConstructClient — 3 шага:

```
1. POST https://api.accounts-bc.com/v1/auth/login
   Body: { email, password, domain: 'www.accounts-bc.com' }
   → Set-Cookie headers (сохраняем)

2. POST https://api.accounts-bc.com/v1/twoFaAuth/verifications/codes
   Body: { twoFactorCode: TOTP(secret), rememberMachine: false }
   Cookie: (cookies из шага 1)
   → новые Set-Cookie headers (заменяем)

3. GET https://api.accounts-bc.com/connect/authorize
   Query: { client_id: 'BackOfficeSSO', response_type: 'code token id_token', ... }
   Cookie: (cookies из шага 2)
   → HTML с <input name="access_token" value="...">
   → парсим через cheerio → сохраняем как bo_sso_token

Результат: authCookies = { bo_sso_token: '...' }
TTL: 3600 - 60 = 3540 секунд
```

### AffiliatesClient — 2 шага (после BC auth):
```
1. GET https://backofficewebadmin.betconstruct.com/api/en/Account/CheckAuthentication
   Cookie: (bo_sso_token)
   → заголовок `authentication` = токен

2. POST {affiliateBaseURL}/global/api/core/signInFromBetconstruct
   Body: { authToken: токен из шага 1 }
   → Set-Cookie headers → сохраняем как authCookies

Результат: authCookies = { ...session_cookies... }
TTL: 3600 секунд
```

### CRMClient — 2 шага (после BC auth):
```
1. GET https://backofficewebadmin.betconstruct.com/api/en/Account/CheckAuthentication
   → заголовок `authentication` = токен

2. POST {crmBaseURL}/api/en/User/LoginWithPlatform
   Body: токен (raw string, не объект!)
   → JSON: { Data: 'crm_token_string' }

Результат: authCookies = { token: 'crm_token_string' }
TTL: 3600 секунд
```

---

## Управление сессией (кеширование)

Чтобы не авторизовываться при каждом запуске бота:

```typescript
import fs from 'fs';

// При старте — пробуем загрузить сессию
const client = new BetsConstructClient(credentials);
const sessionFile = './session.json';

if (fs.existsSync(sessionFile)) {
    const { cookies, expires_at } = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    client.setSession(cookies, expires_at);
}

// Использование...
const user = await client.users().get(123);

// После работы — сохраняем сессию
fs.writeFileSync(sessionFile, JSON.stringify(client.getSession()));
```

---

## Все существующие методы

### users() → BackOffice /api/en/Client/*

| Метод | HTTP | Endpoint | Описание |
|---|---|---|---|
| `get(userId)` | GET | `/GetClientById` | Получить данные юзера по ID |
| `getKPI(userId)` | GET | `/GetClientKpi` | KPI юзера |
| `update(userId, data)` | POST | `/SaveClientInfo` | Обновить данные юзера |
| `updatePassword(userId, password)` | POST | `/ResetPassword` | Сменить пароль |
| `getAccounts(userId)` | POST | `/GetClientAccounts` | Счета/балансы юзера |
| `getBonuses(clientId, params?)` | POST | `/GetClientBonuses` | Бонусы юзера |
| `createPaymentDocument(clientId, currency, amount, type, params?)` | POST | `/CreateClientPaymentDocument` | Создать платёжный документ |
| `attachBonus(clientId, bonusId, amount, type, params?)` | POST | `/AddClientToBonus` | Выдать бонус юзеру |
| `search(params?)` | POST | `/GetClients` | Поиск юзеров по фильтрам |
| `updateClientDetails(params)` | POST | `/UpdateClientDetails` | Обновить детали клиента |

### reports() → BackOffice /api/en/Report/*

| Метод | HTTP | Endpoint | Описание |
|---|---|---|---|
| `getTurnOverReport(params)` | POST | `/GetClientTurnoverReportWithActiveBonus` | Оборот клиентов |
| `getBets(params)` | POST | `/GetBetReport` | Ставки |
| `getBonusReport(params)` | POST | `/GetClientBonusReport` | Отчёт по бонусам |
| `getBetReport(params)` | POST | `/GetBetReport` | Алиас getBets |

### bonuses() → BackOffice /api/en/Client/*

| Метод | HTTP | Endpoint | Описание |
|---|---|---|---|
| `getList(partnerId?, params?)` | POST | `/GetPartnerBonuses` | Список бонусов партнёра |

### financials() → BackOffice /api/null/Financial/*

| Метод | HTTP | Endpoint | Описание |
|---|---|---|---|
| `getTransactions(params?)` | POST | `/GetDocumentsWithPaging` | Транзакции с пагинацией |

### settings() → BackOffice /api/en/setting/*

| Метод | HTTP | Endpoint | Описание |
|---|---|---|---|
| `getSettings()` | GET | `/GetSetting` | Текущие настройки аккаунта |
| `saveSetting(params)` | POST | `/saveSetting` | Сохранить настройки |

### promoCodes() → BackOffice /api/en/Report/* и /api/en/PromoCode/*

| Метод | HTTP | Endpoint | Описание |
|---|---|---|---|
| `getClientPromoCodes(params?)` | POST | `/GetClientPromoCodes` | Отчёт по использованию промокодов (по умолчанию за сегодня) |
| `create(params)` | POST | `/api/en/PromoCode/Save` | Создать промокод |

**Пример создания промокода (FreeSpin):**
```typescript
await client.withPreSelectedPartnerId();

await client.promoCodes().create({
    Code: 'SUMMER50',
    BonusId: 410525,        // ID бонуса партнёра (Type=5 FreeSpin)
    TypeId: 4,              // 4 = FreeSpin
    StartDateLocal: '2026-02-28 00:00:00',
    EndDateLocal: '2026-03-31 23:59:00',
    StartDate: '2026-02-28 00:00:00',
    EndDate: '2026-03-31 23:59:00',
    IsActive: true,
    IsForVerified: true,
    IsFromOtherPlaces: true,
    MaxCount: '100',
    PromoItems: [
        { CurrencyId: 'TRY', Amount: '50', IsDeleted: false }, // 50 спинов для TRY
    ],
    PromoCodeItems: [
        { CurrencyId: 'TRY', Amount: '50', IsDeleted: false }, // дублирует PromoItems
    ],
    CustomClientCategories: [null],
});
```

**Пример получения отчёта:**
```typescript
const report = await client.promoCodes().getClientPromoCodes({ Code: 'SUMMER50' });
// report.Data — массив использований промокода
```

**Найти доступные FreeSpin бонусы партнёра:**
```typescript
const bonusList = await client.bonuses().getList();
const freeSpins = bonusList.Data.filter(b => b.Type === 5 && !b.IsDeleted);
```

**Переключение между партнёрами:**
```typescript
await client.changeActiveProject(12345); // выбрать партнёра
await client.promoCodes().create({ ... }); // создать промокод для него
```

### affiliates.players() → Affiliates API

| Метод | HTTP | Endpoint | Описание |
|---|---|---|---|
| `get(params?)` | POST | `/global/api/Statistics/getPlayersStatisticsPro` | Статистика игроков |
| `attachPlayerToRefId(params)` | POST | `/global/api/Player/addPlayerFromSpring` | Привязать игрока к рефу |

### crm.segments() → CRM API

| Метод | HTTP | Endpoint | Описание |
|---|---|---|---|
| `update(segmentId, params?)` | POST | `/api/en/Segment/Update` | Обновить сегмент |

---

## Enums

### BonusType
```typescript
import { BonusType } from 'betco-ts-sdk';

BonusType.SPORT_BONUS    // 1
BonusType.WAGERING_BONUS // 2
BonusType.DEPOSIT        // 3
BonusType.FREE_SPIN      // 5
BonusType.FREE_BET       // 6
BonusType.BONUS_MONEY    // 7
```

### PaymentDocumentType
```typescript
import { PaymentDocumentType } from './src';

PaymentDocumentType.WITHDRAWAL               // 1
PaymentDocumentType.DEPOSIT                  // 2
PaymentDocumentType.CORRECTION_UP            // 3
PaymentDocumentType.CORRECTION_DOWN          // 4
PaymentDocumentType.LOYALTY_POINTS_CORRECTION_UP   // 5
PaymentDocumentType.LOYALTY_POINTS_CORRECTION_DOWN // 6
PaymentDocumentType.BONUS_CORRECTION         // 9
PaymentDocumentType.CASHBACK_CORRECTION      // 10
```

---

## Обработка ошибок

```typescript
import {
    BetsConstructAuthException,
    BetsConstructRequestException,
    BetsConstructLogicException,
} from 'betco-ts-sdk';

try {
    const user = await client.users().get(123);
} catch (e) {
    if (e instanceof BetsConstructAuthException) {
        // Проблема с авторизацией (неверный пароль, истёк токен)
        console.error('Auth error:', e.message, e.code);
    } else if (e instanceof BetsConstructRequestException) {
        // API вернул 4xx/5xx
        console.error('Request error:', e.message, e.code, e.body);
    } else if (e instanceof BetsConstructLogicException) {
        // Неверные параметры вызова (например, не передан partnerId)
        console.error('Logic error:', e.message);
    }
}
```

---

## Как добавить новый метод в существующий Action

**Пример: добавить `getClientDocuments(userId)` в Users**

1. Открыть `src/actions/Users.ts`
2. Добавить в конец класса:

```typescript
async getClientDocuments(userId: string | number): Promise<Record<string, unknown>> {
    await this.ensureAuthenticated();
    return this.sendRequest('/api/en/Client/GetClientDocuments', { ClientId: userId }, 'GET');
}
```

3. Готово. Метод сразу доступен:
```typescript
const docs = await client.users().getClientDocuments(123);
```

**Как найти URL и параметры:**
Открыть backoffice в браузере → F12 → Network → выполнить нужное действие → найти запрос → скопировать URL и тело.

---

## Как добавить новый Action класс (группу методов)

**Пример: добавить `Payments` для BackOffice**

1. Создать `src/actions/Payments.ts`:

```typescript
import { BaseAction } from './BaseAction';

export class Payments extends BaseAction {
    async getPaymentSystems(): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Payment/GetPaymentSystems', {}, 'GET');
    }

    async processPayment(params: Record<string, unknown>): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Payment/ProcessPayment', params);
    }
}
```

2. Добавить в `src/clients/BetsConstructClient.ts`:

```typescript
import { Payments } from '../actions/Payments';

// В теле класса:
payments(): Payments { return new Payments(this); }
```

3. Добавить в `src/index.ts`:

```typescript
export type { ... } from './actions/Payments'; // если есть интерфейсы
```

4. Использование:
```typescript
const systems = await client.payments().getPaymentSystems();
```

---

## Как добавить новый Action для Affiliates или CRM

Аналогично, но наследуй от `BaseAffiliatesAction` или `BaseCRMAction`:

```typescript
// src/affiliatesActions/Reports.ts
import { BaseAffiliatesAction } from './BaseAffiliatesAction';

export class AffiliatesReports extends BaseAffiliatesAction {
    async getSummary(params = {}): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/global/api/Statistics/getSummary', params);
    }
}
```

Добавить в `AffiliatesClient.ts`:
```typescript
import { AffiliatesReports } from '../affiliatesActions/Reports';
affiliatesReports(): AffiliatesReports { return new AffiliatesReports(this); }
```

---

## Архитектурные решения

### Почему интерфейсы IBetsConstructClient, IAffiliatesClient, ICRMClient?

TypeScript имеет проблему циклических импортов:
- `BetsConstructClient` импортирует `Reports`
- `Reports` наследует `BaseAction` который импортирует `BetsConstructClient`

Решение: `BaseAction` зависит от **интерфейса** `IBetsConstructClient`, а не от конкретного класса. Это разрывает цикл.

### Почему `validateStatus: () => true` во всех axios запросах?

По умолчанию axios выбрасывает исключение на любой 4xx/5xx статус. Чтобы обрабатывать ошибки так же как PHP (проверить статус и выбросить свой тип исключения), мы отключаем это поведение и проверяем статус вручную.

### Почему не используется tough-cookie?

Cookies управляются вручную через простые объекты `Record<string, string>`. Это проще, прозрачнее и не требует дополнительных зависимостей. Утилиты `parseSetCookies` и `buildCookieHeader` в `utils.ts` покрывают всё необходимое.

### TOTP (GoogleAuth)

Реализован без сторонних библиотек через встроенный Node.js `crypto.createHmac`.
Файл: `src/GoogleAuth.ts`. Совместим с Google Authenticator.

---

## Быстрый пример использования

```typescript
import { BetsConstructClient, Credentials, PaymentDocumentType, BonusType } from 'betco-ts-sdk';

const client = new BetsConstructClient(
    new Credentials('admin@example.com', 'password123', 'BASE32TOTPSECRET'),
);

// Получить юзера
const user = await client.users().get(12345);
console.log(user);

// Пополнить баланс
await client.users().createPaymentDocument(
    12345,
    'USD',
    100,
    PaymentDocumentType.DEPOSIT,
    { Info: 'Manual top-up' },
);

// Выдать бонус
await client.users().attachBonus(
    12345,
    99,    // bonusId
    50,    // amount
    BonusType.FREE_BET,
    { Note: 'Welcome bonus' },
);

// Поиск юзеров
const results = await client.users().search({
    Email: 'test@example.com',
    MaxRows: 10,
    SkeepRows: 0,
});

// Получить ставки
const bets = await client.reports().getBets({
    filterBet: {
        StartDateLocal: '2024-01-01T00:00:00',
        EndDateLocal: '2024-01-31T23:59:59',
        ClientId: '12345',
        MaxRows: 100,
        SkeepRows: 0,
        IsOrderedDesc: true,
        IsWithSelections: false,
    },
});
```
