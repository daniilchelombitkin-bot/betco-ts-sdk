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

Bots communicate with the SDK over HTTP — no credentials needed in the bot:

```javascript
const res = await fetch('http://sdk:3000/rpc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method: 'users.get', params: { userId: 12345 } }),
});
const { result } = await res.json();
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
