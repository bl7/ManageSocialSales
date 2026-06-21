# COUNTER

Internal business counter for inventory, sales, purchases, parties, expenses, and cash ledger.

## Tech Stack

- Next.js (App Router) + TypeScript
- PostgreSQL with `pg` (node-postgres)
- Tailwind CSS
- bcrypt + JWT session cookies

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and update values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| `PGHOST` | PostgreSQL host |
| `PGPORT` | PostgreSQL port (default 5432) |
| `PGDATABASE` | Database name |
| `PGUSER` | Database username |
| `PGPASSWORD` | Database password |
| `PGSSLMODE` | `disable`, `prefer`, or `require` |
| `JWT_SECRET` | Secret for signing session tokens |
| `SESSION_SECRET` | Fallback secret (optional if JWT_SECRET set) |
| `NODE_ENV` | `development` or `production` |
| `ADMIN_EMAIL` | Login email for seed script |
| `ADMIN_PASSWORD` | Login password for seed script |

Alternatively, set `DATABASE_URL` instead of the `PG*` variables.

All app tables use the `bij_` prefix (e.g. `bij_products`) so they can share a database with other projects.

### 3. Run migrations

```bash
npm run db:migrate
```

### 4. Seed sample data

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then:

```bash
npm run db:seed
```

### 5. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your admin credentials.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed admin user and sample data |

## Pages

- **Login** — Secure single-account authentication
- **Dashboard** — Inventory and sales overview
- **Products** — Product/variant list with search and filters
- **Product Detail** — Variants, stock, recent movements
- **Add/Edit Product** — Product and variant management
- **Record Purchase** — Incoming stock
- **Record Sale** — Outgoing stock (Instagram, WhatsApp, etc.)
- **Stock Adjustment** — Damaged, lost, returned, corrections
- **Stock Ledger** — Complete inventory movement history
- **Reports** — Best sellers, slow movers, valuation, revenue, profit
- **Sales** — Daily sales history with revenue and estimated profit by period
- **Credit Summary** — Live view of amounts to collect and pay
- **Investment** — Track investor capital and compare with business returns
- **Purchases** — Purchase history with credit tracking
- **Expenses** — Business expenses by category
- **Settings** — Business name, currency, low stock threshold

## Core Inventory Rules

Stock is **never edited directly**. All changes go through:

1. **Purchase** — increases stock
2. **Sale** — decreases stock (rejected if insufficient)
3. **Stock Adjustment** — positive or negative (rejected if result is negative)

Every movement creates a permanent `inventory_ledger` entry with `stock_after` calculated at transaction time.

## Production Notes

- Set `NODE_ENV=production`
- Use a strong `JWT_SECRET` (32+ random characters)
- Use a strong `ADMIN_PASSWORD`
- Serve over HTTPS (required for secure cookies)
- Run migrations before deployment: `npm run db:migrate`
- Back up your PostgreSQL database regularly
- Never commit `.env` or expose `DATABASE_URL`

## Security Checklist

- [ ] Change `JWT_SECRET` before production
- [ ] Use strong `ADMIN_PASSWORD`
- [ ] Use HTTPS in production
- [ ] Secure cookies enabled automatically in production
- [ ] Never expose database credentials
- [ ] Run migrations before deployment
- [ ] Back up database regularly
