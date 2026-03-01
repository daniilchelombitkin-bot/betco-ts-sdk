# BetCo TypeScript SDK — Codebase Reference

> Reference document for AI assistants and developers. Describes architecture, all methods and patterns for adding new functionality.

---

## Overview

TypeScript SDK for working with BetConstruct BackOffice API, Affiliates API and CRM API.
Port of the original PHP SDK (`ggl/betco-php-sdk`).

**Stack:** Node.js, TypeScript, axios, cheerio (HTML parsing for OAuth)
**Dependencies:** run `npm install` in the `betco-ts-sdk` folder

---

## Project Structure

```
betco-ts-sdk/
├── src/
│   ├── index.ts                        ← entry point, re-exports all public API
│   ├── server.ts                       ← HTTP server (RPC endpoint for bots)
│   ├── Credentials.ts                  ← stores login/password/2FA secret
│   ├── GoogleAuth.ts                   ← TOTP code generation (2FA)
│   ├── utils.ts                        ← parseSetCookies, buildCookieHeader
│   │
│   ├── clients/
│   │   ├── BetsConstructClient.ts      ← MAIN client (BackOffice)
│   │   ├── AffiliatesClient.ts         ← Affiliates API client
│   │   ├── CRMClient.ts                ← CRM API client
│   │   ├── IBetsConstructClient.ts     ← interface (avoids circular imports)
│   │   ├── IAffiliatesClient.ts        ← interface
│   │   └── ICRMClient.ts               ← interface
│   │
│   ├── actions/                        ← BackOffice API actions
│   │   ├── BaseAction.ts               ← base class: sendRequest(), ensureAuthenticated()
│   │   ├── Reports.ts                  ← reports
│   │   ├── Users.ts                    ← users
│   │   ├── Bonuses.ts                  ← bonuses
│   │   ├── Financials.ts               ← financials/transactions
│   │   ├── Settings.ts                 ← account settings
│   │   └── PromoCodes.ts               ← promo codes
│   │
│   ├── affiliatesActions/              ← Affiliates API actions
│   │   ├── BaseAffiliatesAction.ts     ← base class for Affiliates
│   │   └── Players.ts                  ← players
│   │
│   ├── crmActions/                     ← CRM API actions
│   │   ├── BaseCRMAction.ts            ← base class for CRM
│   │   └── Segments.ts                 ← segments
│   │
│   ├── enums/
│   │   ├── BonusType.ts                ← bonus types (numeric values)
│   │   └── PaymentDocumentType.ts      ← payment document types
│   │
│   ├── constants/
│   │   └── HttpMethod.ts               ← GET, POST, PUT, etc.
│   │
│   └── exceptions/
│       ├── BetsConstructException.ts         ← base error class
│       ├── BetsConstructAuthException.ts     ← authentication errors
│       ├── BetsConstructRequestException.ts  ← HTTP request errors (4xx/5xx)
│       └── BetsConstructLogicException.ts    ← logic errors (invalid params)
│
├── Dockerfile                          ← Docker image
├── .env.example                        ← environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── codebase.md (this file)
```

---

## Setup & Running

**Via Docker (recommended):**
```bash
cp .env.example .env   # fill in credentials
docker-compose up --build
```

**Local development:**
```bash
npm install
npm run build      # compile TS → JS into /dist
npm run dev        # watch mode
npm start          # start HTTP server (dist/server.js)
```

Bots communicate with the SDK over HTTP (see **HTTP Server** section). The SDK is not imported directly into bots — one server for all bots.

---

## HTTP Server (src/server.ts)

**File:** `src/server.ts`

Runs the SDK as a standalone HTTP service accessible from any project or container. One authenticated client per server — logs in once.

### Environment Variables

| Variable | Description |
|---|---|
| `BC_EMAIL` | BackOffice login |
| `BC_PASSWORD` | BackOffice password |
| `BC_TOTP_SECRET` | Base32 TOTP secret (2FA) |
| `AFFILIATES_URL` | Affiliates API URL |
| `CRM_URL` | CRM API URL (optional) |
| `PORT` | Server port (default `3000`) |

### Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/rpc` | Call any SDK method |
| `GET` | `/health` | Health check |

### Request Format /rpc

```json
{
  "method": "users.get",
  "params": { "userId": 12345 }
}
```

Success response:
```json
{ "ok": true, "result": { ... } }
```

Error response:
```json
{ "ok": false, "error": "error description", "code": null }
```

### All Available Methods

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
| `users.updateClientDetails` | `{ ...client fields }` |
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

### Docker Compose (two containers)

Folder structure:
```
projects/
├── betco-ts-sdk/      ← SDK + server
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── bot/               ← your bot
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

### Bot Client (sdk.js)

```javascript
const SDK_URL = process.env.SDK_URL ?? 'http://localhost:3000';

async function rpc(method, params = {}) {
    const res = await fetch(`${SDK_URL}/rpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, params }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? 'SDK error');
    return data.result;
}

module.exports = {
    getUser: (userId) => rpc('users.get', { userId }),
    searchUsers: (params) => rpc('users.search', params),
    getUserAccounts: (userId) => rpc('users.getAccounts', { userId }),
    getUserBonuses: (clientId, params) => rpc('users.getBonuses', { clientId, params }),
    createPaymentDocument: (clientId, currency, amount, type, params) =>
        rpc('users.createPaymentDocument', { clientId, currency, amount, type, params }),
    attachBonus: (clientId, bonusId, amount, type) =>
        rpc('users.attachBonus', { clientId, bonusId, amount, type }),
    getBets: (params) => rpc('reports.getBets', params),
    getTurnOverReport: (params) => rpc('reports.getTurnOverReport', params),
    getBonusReport: (params) => rpc('reports.getBonusReport', params),
    getBonusList: (partnerId, params) => rpc('bonuses.getList', { partnerId, params }),
    getTransactions: (params) => rpc('financials.getTransactions', params),
    getSettings: () => rpc('settings.getSettings'),
    createPromoCode: (params) => rpc('promoCodes.create', params),
    getClientPromoCodes: (params) => rpc('promoCodes.getClientPromoCodes', params),
    getAffPlayers: (params) => rpc('affiliates.players.get', params),
    updateSegment: (segmentId, params) => rpc('crm.segments.update', { segmentId, params }),
    changeActiveProject: (projectId) => rpc('client.changeActiveProject', { projectId }),
};
```

---

## Clients

### BetsConstructClient (main — BackOffice)

**File:** `src/clients/BetsConstructClient.ts`

```typescript
import { BetsConstructClient, Credentials } from 'betco-ts-sdk';

const client = new BetsConstructClient(
    new Credentials('email@example.com', 'password', 'TOTP_SECRET_BASE32'),
    true // reauthenticateAutomatically (default: true)
);

// Everything is async — always use await
const user = await client.users().get(12345);
const bets = await client.reports().getBets({ ... });
```

**Client methods:**
| Method | Description |
|---|---|
| `users()` | Returns Users actions object |
| `reports()` | Returns Reports actions object |
| `bonuses()` | Returns Bonuses actions object |
| `financials()` | Returns Financials actions object |
| `settings()` | Returns Settings actions object |
| `promoCodes()` | Returns PromoCodes actions object |
| `authenticate()` | Force authentication (3 steps) |
| `ensureAuthenticated()` | Check session, authenticate if needed |
| `withPreSelectedPartnerId()` | Load and store current partnerId |
| `changeActiveProject(id)` | Switch active project |
| `getSession()` | Export session for caching |
| `setSession(cookies, expiresAt)` | Restore session from cache |
| `getAuthCookies()` | Get current auth cookies |
| `getPartnerId()` | Get current partnerId |

---

### AffiliatesClient

**File:** `src/clients/AffiliatesClient.ts`

```typescript
import { AffiliatesClient } from 'betco-ts-sdk';

const affiliates = new AffiliatesClient(
    client,                              // BetsConstructClient (needed for auth)
    'https://xyz.affiliates.betconstruct.com',
);

const players = await affiliates.players().get({ start: 0, limit: 50 });
```

**Auth:** uses BetsConstructClient → CheckAuthentication → signInFromBetconstruct

---

### CRMClient

**File:** `src/clients/CRMClient.ts`

```typescript
import { CRMClient } from 'betco-ts-sdk';

const crm = new CRMClient(
    client,                              // BetsConstructClient
    'https://crm-t.betconstruct.com',   // default
);

await crm.segments().update(42, { ... });
```

**Auth:** uses BetsConstructClient → CheckAuthentication → LoginWithPlatform → token from `Data`

---

## Authentication (details)

### BetsConstructClient — 3 steps:

```
1. POST https://api.accounts-bc.com/v1/auth/login
   Body: { email, password, domain: 'www.accounts-bc.com' }
   → Set-Cookie headers (saved)

2. POST https://api.accounts-bc.com/v1/twoFaAuth/verifications/codes
   Body: { twoFactorCode: TOTP(secret), rememberMachine: false }
   Cookie: (cookies from step 1)
   → new Set-Cookie headers (replaced)

3. GET https://api.accounts-bc.com/connect/authorize
   Query: { client_id: 'BackOfficeSSO', response_type: 'code token id_token', ... }
   Cookie: (cookies from step 2)
   → HTML with <input name="access_token" value="...">
   → parsed via cheerio → saved as bo_sso_token

Result: authCookies = { bo_sso_token: '...' }
TTL: 3600 - 60 = 3540 seconds
```

### AffiliatesClient — 2 steps (after BC auth):
```
1. GET https://backofficewebadmin.betconstruct.com/api/en/Account/CheckAuthentication
   Cookie: (bo_sso_token)
   → header `authentication` = token

2. POST {affiliateBaseURL}/global/api/core/signInFromBetconstruct
   Body: { authToken: token from step 1 }
   → Set-Cookie headers → saved as authCookies

Result: authCookies = { ...session_cookies... }
TTL: 3600 seconds
```

### CRMClient — 2 steps (after BC auth):
```
1. GET https://backofficewebadmin.betconstruct.com/api/en/Account/CheckAuthentication
   → header `authentication` = token

2. POST {crmBaseURL}/api/en/User/LoginWithPlatform
   Body: token (raw string, not an object!)
   → JSON: { Data: 'crm_token_string' }

Result: authCookies = { token: 'crm_token_string' }
TTL: 3600 seconds
```

---

## Session Management (caching)

To avoid re-authenticating on every restart:

```typescript
import fs from 'fs';

const client = new BetsConstructClient(credentials);
const sessionFile = './session.json';

if (fs.existsSync(sessionFile)) {
    const { cookies, expires_at } = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
    client.setSession(cookies, expires_at);
}

const user = await client.users().get(123);

fs.writeFileSync(sessionFile, JSON.stringify(client.getSession()));
```

---

## All Available Methods

### users() → BackOffice /api/en/Client/*

| Method | HTTP | Endpoint | Description |
|---|---|---|---|
| `get(userId)` | GET | `/GetClientById` | Get user data by ID |
| `getKPI(userId)` | GET | `/GetClientKpi` | User KPI |
| `update(userId, data)` | POST | `/SaveClientInfo` | Update user data |
| `updatePassword(userId, password)` | POST | `/ResetPassword` | Change password |
| `getAccounts(userId)` | POST | `/GetClientAccounts` | User accounts/balances |
| `getBonuses(clientId, params?)` | POST | `/GetClientBonuses` | User bonuses |
| `createPaymentDocument(clientId, currency, amount, type, params?)` | POST | `/CreateClientPaymentDocument` | Create payment document |
| `attachBonus(clientId, bonusId, amount, type, params?)` | POST | `/AddClientToBonus` | Give bonus to user |
| `search(params?)` | POST | `/GetClients` | Search users by filters |
| `updateClientDetails(params)` | POST | `/UpdateClientDetails` | Update client details |

### reports() → BackOffice /api/en/Report/*

| Method | HTTP | Endpoint | Description |
|---|---|---|---|
| `getTurnOverReport(params)` | POST | `/GetClientTurnoverReportWithActiveBonus` | Client turnover |
| `getBets(params)` | POST | `/GetBetReport` | Bets |
| `getBonusReport(params)` | POST | `/GetClientBonusReport` | Bonus report |
| `getBetReport(params)` | POST | `/GetBetReport` | Alias for getBets |

### bonuses() → BackOffice /api/en/Client/*

| Method | HTTP | Endpoint | Description |
|---|---|---|---|
| `getList(partnerId?, params?)` | POST | `/GetPartnerBonuses` | Partner bonus list |

### financials() → BackOffice /api/null/Financial/*

| Method | HTTP | Endpoint | Description |
|---|---|---|---|
| `getTransactions(params?)` | POST | `/GetDocumentsWithPaging` | Transactions with pagination |

### settings() → BackOffice /api/en/setting/*

| Method | HTTP | Endpoint | Description |
|---|---|---|---|
| `getSettings()` | GET | `/GetSetting` | Current account settings |
| `saveSetting(params)` | POST | `/saveSetting` | Save settings |

### promoCodes() → BackOffice /api/en/Report/* and /api/en/PromoCode/*

| Method | HTTP | Endpoint | Description |
|---|---|---|---|
| `getClientPromoCodes(params?)` | POST | `/GetClientPromoCodes` | Promo code usage report (default: today) |
| `create(params)` | POST | `/api/en/PromoCode/Save` | Create promo code |

**FreeSpin promo code example:**
```typescript
await client.withPreSelectedPartnerId();

await client.promoCodes().create({
    Code: 'SUMMER50',
    BonusId: 410525,        // partner bonus ID (Type=5 FreeSpin)
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
        { CurrencyId: 'TRY', Amount: '50', IsDeleted: false }, // 50 spins for TRY
    ],
    PromoCodeItems: [
        { CurrencyId: 'TRY', Amount: '50', IsDeleted: false },
    ],
    CustomClientCategories: [null],
});
```

**Find available FreeSpin bonuses for partner:**
```typescript
const bonusList = await client.bonuses().getList();
const freeSpins = bonusList.Data.filter(b => b.Type === 5 && !b.IsDeleted);
```

**Switch between partners:**
```typescript
await client.changeActiveProject(12345);
await client.promoCodes().create({ ... });
```

### affiliates.players() → Affiliates API

| Method | HTTP | Endpoint | Description |
|---|---|---|---|
| `get(params?)` | POST | `/global/api/Statistics/getPlayersStatisticsPro` | Player statistics |
| `attachPlayerToRefId(params)` | POST | `/global/api/Player/addPlayerFromSpring` | Attach player to ref |

### crm.segments() → CRM API

| Method | HTTP | Endpoint | Description |
|---|---|---|---|
| `update(segmentId, params?)` | POST | `/api/en/Segment/Update` | Update segment |

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
import { PaymentDocumentType } from 'betco-ts-sdk';

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

## Error Handling

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
        // Auth problem (wrong password, expired token)
        console.error('Auth error:', e.message, e.code);
    } else if (e instanceof BetsConstructRequestException) {
        // API returned 4xx/5xx
        console.error('Request error:', e.message, e.code, e.body);
    } else if (e instanceof BetsConstructLogicException) {
        // Invalid call params (e.g. missing partnerId)
        console.error('Logic error:', e.message);
    }
}
```

---

## How to Add a New Method to an Existing Action

**Example: add `getClientDocuments(userId)` to Users**

1. Open `src/actions/Users.ts`
2. Add at the end of the class:

```typescript
async getClientDocuments(userId: string | number): Promise<Record<string, unknown>> {
    await this.ensureAuthenticated();
    return this.sendRequest('/api/en/Client/GetClientDocuments', { ClientId: userId }, 'GET');
}
```

3. Done. Method is immediately available:
```typescript
const docs = await client.users().getClientDocuments(123);
```

**How to find the URL and params:**
Open backoffice in browser → F12 → Network → perform the action → find the request → copy URL and body.

Also add the method to `server.ts` RPC methods map and to `sdk.js` in the bot.

---

## How to Add a New Action Class

**Example: add `Payments` for BackOffice**

1. Create `src/actions/Payments.ts`:

```typescript
import { BaseAction } from './BaseAction';

export class Payments extends BaseAction {
    async getPaymentSystems(): Promise<Record<string, unknown>> {
        await this.ensureAuthenticated();
        return this.sendRequest('/api/en/Payment/GetPaymentSystems', {}, 'GET');
    }
}
```

2. Add to `src/clients/BetsConstructClient.ts`:

```typescript
import { Payments } from '../actions/Payments';

payments(): Payments { return new Payments(this); }
```

3. Add to `src/server.ts`:

```typescript
'payments.getSystems': (_) => client.payments().getPaymentSystems(),
```

4. Add to `sdk.js` in the bot:

```javascript
getPaymentSystems: () => rpc('payments.getSystems'),
```

---

## How to Add a New Action for Affiliates or CRM

Same pattern, but extend `BaseAffiliatesAction` or `BaseCRMAction`:

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

Add to `AffiliatesClient.ts`:
```typescript
import { AffiliatesReports } from '../affiliatesActions/Reports';
affiliatesReports(): AffiliatesReports { return new AffiliatesReports(this); }
```

---

## Architectural Decisions

### Why interfaces IBetsConstructClient, IAffiliatesClient, ICRMClient?

TypeScript has a circular import problem:
- `BetsConstructClient` imports `Reports`
- `Reports` extends `BaseAction` which imports `BetsConstructClient`

Solution: `BaseAction` depends on the **interface** `IBetsConstructClient`, not the concrete class. This breaks the cycle.

### Why `validateStatus: () => true` in all axios requests?

By default axios throws on any 4xx/5xx status. To handle errors like the PHP version (check status and throw a typed exception), we disable this behavior and check status manually.

### Why not use tough-cookie?

Cookies are managed manually via plain `Record<string, string>` objects. Simpler, more transparent, no extra dependencies. The `parseSetCookies` and `buildCookieHeader` utilities in `utils.ts` cover everything needed.

### TOTP (GoogleAuth)

Implemented without third-party libraries using Node.js built-in `crypto.createHmac`.
File: `src/GoogleAuth.ts`. Compatible with Google Authenticator.

---

## Quick Usage Example

```typescript
import { BetsConstructClient, Credentials, PaymentDocumentType, BonusType } from 'betco-ts-sdk';

const client = new BetsConstructClient(
    new Credentials('admin@example.com', 'password123', 'BASE32TOTPSECRET'),
);

// Get user
const user = await client.users().get(12345);
console.log(user);

// Deposit balance
await client.users().createPaymentDocument(
    12345,
    'USD',
    100,
    PaymentDocumentType.DEPOSIT,
    { Info: 'Manual top-up' },
);

// Give bonus
await client.users().attachBonus(
    12345,
    99,    // bonusId
    50,    // amount
    BonusType.FREE_BET,
    { Note: 'Welcome bonus' },
);

// Search users
const results = await client.users().search({
    Email: 'test@example.com',
    MaxRows: 10,
    SkeepRows: 0,
});

// Get bets
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
