# BetCo BackOffice TypeScript SDK

TypeScript/Node.js SDK for working with BetConstruct BackOffice, Affiliates and CRM APIs.

## Requirements

- Node.js 18+
- Docker (for running as a service)

## Running with Docker

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `BC_EMAIL` | BackOffice login |
| `BC_PASSWORD` | BackOffice password |
| `BC_TOTP_SECRET` | Base32 TOTP secret (2FA) |
| `AFFILIATES_URL` | Affiliates API URL |
| `API_SECRET` | Secret token for bot authentication (optional but recommended) |

Start:

```bash
docker-compose up --build
```

Or without compose:

```bash
docker build -t betco-sdk .
docker run -d --env-file .env -p 3000:3000 betco-sdk
```

## Usage from a bot

### Option A — TypeScript with full hints (recommended)

Install the SDK in your bot project for typed access to the running server:

```bash
npm install git+https://TOKEN@github.com/daniilchelombitkin-bot/betco-ts-sdk.git
```

```typescript
import { SdkHttpClient } from 'betco-ts-sdk';

const sdk = new SdkHttpClient(
    process.env.SDK_URL!,    // http://YOUR_SERVER_IP:3000
    process.env.SDK_SECRET,  // same as API_SECRET in server .env
);

const user = await sdk.users.get(12345);
const bets = await sdk.reports.getBets({ filterBet: { ... } });
```

No BetConstruct credentials needed in the bot — auth is centralized on the server.

### Option B — Plain JS (sdk.js)

Copy `sdk.js` from this repo into your bot. Set `SDK_URL` and `SDK_SECRET` env vars.

```javascript
const sdk = require('./sdk');
const user = await sdk.getUser(12345);
```

## Local development

```bash
npm install
npm run build   # compile TS → JS
npm run dev     # watch mode
npm start       # start HTTP server
```

## Documentation

Full documentation, all methods, Docker setup and how to add new functionality — see [codebase.md](./codebase.md).
