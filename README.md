# BetCo BackOffice TypeScript SDK

TypeScript/Node.js порт PHP SDK для работы с BetConstruct BackOffice API.

## Требования

- Node.js 18+
- TypeScript 5+

## Установка

### Как npm-пакет из GitHub

```bash
npm install github:ВАШ_USERNAME/betco-ts-sdk
```

npm автоматически клонирует репо и соберёт TypeScript через `prepare` скрипт.

Для приватного репо нужен Personal Access Token — добавь в `.npmrc` проекта:

```
//npm.pkg.github.com/:_authToken=ВАШ_GITHUB_TOKEN
```

### Локально (для разработки SDK)

```bash
cd betco-ts-sdk
npm install
npm run build
```

## Базовое использование

```typescript
import { BetsConstructClient, Credentials } from 'betco-ts-sdk';

const client = new BetsConstructClient(
    new Credentials(
        'login',
        'password',
        'secret key (base32 TOTP)',
    ),
);

const report = await client.reports().getTurnOverReport({
    StartTimeLocal: '2024-01-01T00:00:00',
    EndTimeLocal: '2024-01-31T23:59:59',
});

console.log(report);
```

## Сохранение и повторное использование сессии

Авторизация занимает ~3 запроса. Кешируй сессию чтобы не логиниться каждый раз.

```typescript
import { BetsConstructClient, Credentials } from 'betco-ts-sdk';
import fs from 'fs';

const client = new BetsConstructClient(
    new Credentials('login', 'password', 'secret key'),
);

// Загрузить сессию если есть
if (fs.existsSync('session.json')) {
    const { cookies, expires_at } = JSON.parse(fs.readFileSync('session.json', 'utf8'));
    client.setSession(cookies, expires_at);
}

const report = await client.reports().getTurnOverReport({
    StartTimeLocal: '2024-01-01T00:00:00',
    EndTimeLocal: '2024-01-31T23:59:59',
});

console.log(report);

// Сохранить сессию для следующего запуска
fs.writeFileSync('session.json', JSON.stringify(client.getSession()));
```

## Affiliates API

```typescript
import { BetsConstructClient, AffiliatesClient, Credentials } from 'betco-ts-sdk';

const client = new BetsConstructClient(new Credentials('login', 'password', 'secret'));
const affiliates = new AffiliatesClient(client, 'https://xyz.affiliates.betconstruct.com');

const players = await affiliates.players().get({ start: 0, limit: 50 });
```

## CRM API

```typescript
import { BetsConstructClient, CRMClient, Credentials } from 'betco-ts-sdk';

const client = new BetsConstructClient(new Credentials('login', 'password', 'secret'));
const crm = new CRMClient(client); // по умолчанию https://crm-t.betconstruct.com

await crm.segments().update(42, { /* params */ });
```

## Запуск как HTTP сервер

Позволяет использовать SDK из разных проектов/контейнеров через HTTP.

```bash
npm install
npm run build
BC_EMAIL=your@email.com BC_PASSWORD=pass BC_TOTP_SECRET=BASE32 npm start
```

Или через Docker Compose (см. [codebase.md](./codebase.md)):

```bash
docker-compose up --build
```

Вызов из бота:

```typescript
const res = await fetch('http://sdk:3000/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'users.get', params: { userId: 12345 } }),
});
const { result } = await res.json();
```

## Документация

Полная документация, все методы, инструкция по Docker и добавлению нового функционала — в [codebase.md](./codebase.md).
