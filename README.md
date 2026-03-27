# E-commerce Order System (7Span Store)

Full-stack demo: **React + TypeScript + Vite** (client), **Node.js + Express + Prisma** (server), **MySQL** (data), **Redis** (catalog cache), **Docker Compose** for local orchestration.

---

## Quick start (Docker Compose)

From the repository root:

1. Copy environment template and adjust if needed:
  ```bash
   cp .env.example .env
  ```
2. Start MySQL, Redis, API, and SPA:
  ```bash
   docker compose up --build
  ```
3. **Database:** The server image runs migrations (and seed in dev) per `server/Dockerfile`. If the API starts before MySQL is ready, restart the `server` container once.
4. Open the app at **[http://localhost:3000](http://localhost:3000)** (Vite dev default). API: **[http://localhost:5000/api](http://localhost:5000/api)**.

**Default credentials (after seed):** see `server/src/database/seeders/seed.ts` — typically `admin@example.com` / `Pass123!` and `john@example.com` / `Pass123!`.

---

## Local development (without Docker for all services)

### Prerequisites

- Node.js 20+
- MySQL 8+ (running locally)
- Redis 7+ (optional; omit `REDIS_URL` to disable catalog caching)

### 1. Database

Create a database and user, or use root:

```sql
CREATE DATABASE ecommerce CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Server (`server/`)

```bash
cd server
cp ../.env.example .env   # or create server/.env
# Set DATABASE_URL, e.g.:
# DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/ecommerce"
```

Apply schema and generate Prisma Client:

```bash
pnpm install   # or npm install
npx prisma generate
npx prisma db push          # or: npx prisma migrate dev
npm run seed                # optional: sample users, categories, products
npm run dev
```

API listens on **[http://localhost:5000](http://localhost:5000)** (or `PORT` in `.env`).

### 3. Client (`client/`)

```bash
cd client
npm install
npm run dev
```

Vite proxies `/api` and `/socket.io` to the backend (see `client/vite.config.ts`). Use **[http://localhost:3000](http://localhost:3000)**.

### 4. Tests (server)

```bash
cd server
npm test
```

`NODE_ENV=test` disables Redis in the cache layer so tests stay deterministic.

---

## Environment variables (summary)


| Area          | Variables                                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| MySQL         | `DATABASE_URL`                                                                                                                                 |
| Auth          | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` (legacy `JWT_SECRET` may still be read by config) |
| CORS / Socket | `CLIENT_URL`                                                                                                                                   |
| Cache         | `REDIS_URL` (empty = no Redis)                                                                                                                 |


See `**.env.example**` at the repo root for a full list.

---

## Design decisions & assumptions

- **Layered backend:** routes → controllers → services → repositories; validation with **Zod**; consistent JSON error shape.
- **Auth:** Short-lived **access** JWT (httpOnly cookie) + **refresh** token (httpOnly cookie); not localStorage.
- **Roles:** `ADMIN` vs `CUSTOMER`; admin-only product CRUD and admin order views.
- **Money:** Stored as **decimal** in MySQL; UI shows **INR (₹)**.
- **Orders:** `PENDING` / `CONFIRMED` / `CANCELLED`; order lines snapshot **unit price** at time of order.
- **Cart:** One cart per user; line items reference `productId` + quantity.
- **Real-time stock:** Socket.IO broadcasts `stock:update` after order place/cancel so UIs can refresh without polling.
- **Catalog cache (Redis):** List/detail/category responses cached with a **bust epoch** on product/order mutations; safe to run without Redis (falls back to DB).

---

## Database schema (text diagram)

```
┌─────────────┐       ┌────────────┐
│   users     │       │ categories │
│─────────────│       │────────────│
│ id (PK)     │       │ id (PK)    │
│ email (UQ)  │       │ name (UQ)  │
│ name        │       └──────┬─────┘
│ password    │              │
│ role        │              │ 1
└──────┬──────┘              │
       │ 1                   │
       │                     ▼
       │              ┌──────────────┐
       │              │ products     │
       │              │──────────────│
       │              │ id (PK)      │
       │              │ category_id──┼──► (FK categories.id)
       │              │ name, price  │
       │              │ stock, ...   │
       │              └──────┬───────┘
       │                     │
       │ 1                   │ *
       │                     │
       ▼                     ▼
┌─────────────┐       ┌─────────────┐
│ carts       │       │ cart_items  │
│─────────────│       │─────────────│
│ id (PK)     │       │ id (PK)     │
│ user_id (UQ)│◄──────┤ cart_id   ──┼──► (FK carts.id)
└──────┬──────┘       │ product_id ──┼──► (FK products.id)
       │              │ quantity    │
       │              │ (UQ cart+product)
       │              └─────────────┘
       │
       │ 1
       │
       ▼
┌─────────────┐       ┌─────────────┐
│ orders      │       │ order_items │
│─────────────│       │─────────────│
│ id (PK)     │       │ id (PK)     │
│ user_id (FK)│       │ order_id FK │
│ total_amount│◄──────┤ product_id FK
│ status      │       │ quantity    │
│ created_at  │       │ unit_price  │
└─────────────┘       └─────────────┘
```

Relationships:

- **User** 1 — 1 **Cart** (optional in practice after first access).
- **User** 1 — * **Order**.
- **Category** 1 — * **Product**.
- **Cart** 1 — * **CartItem**; **Product** 1 — * **CartItem** (via cart lines).
- **Order** 1 — * **OrderItem**; **Product** 1 — * **OrderItem**.

---

## Discussion & trade-offs

### Why transactions matter for order placement

Order placement does several things that must succeed or fail **together**:

1. Validate stock for every cart line.
2. Create the **order** and **order items** (with **snapshot** unit prices).
3. **Decrement** product stock.
4. **Clear** the cart.

**Without a transaction**, partial failure can leave the system inconsistent:

- Stock could be deducted but no order row (customer loses inventory with no purchase record).
- An order could be created without stock deduction (overselling).
- Cart could be cleared while the order failed (lost cart items).

**With a single database transaction**, either all steps commit or **none** do — MySQL rolls back work on error, preserving invariants.

---

### Optimistic vs pessimistic locking (inventory)


| Approach        | Idea                                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pessimistic** | `SELECT … FOR UPDATE` on product rows (or a stock row) so no other transaction can change those rows until commit.                                         |
| **Optimistic**  | Rely on a **conditional update** at write time (e.g. “decrement only if `stock >= quantity`”) without holding read locks for the whole business operation. |


**This project uses an optimistic-style pattern:**

- Stock is not locked with `FOR UPDATE` for the whole checkout flow.
- Deduction uses **atomic SQL** such as:
  `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`
- If the row count is not 1, stock was insufficient or another transaction won — the service treats the order as failed and **rolls back**.

**Why:** avoids long-held locks under load, keeps implementation simple, and still prevents **negative stock** at the database level. **Trade-off:** under very high contention, users may see more “insufficient stock” failures at the last moment than with pessimistic locking.

---

### Database indexing — what was indexed and why


| Table / index   | Columns                                 | Purpose                                                  |
| --------------- | --------------------------------------- | -------------------------------------------------------- |
| **users**       | `name` (B-tree)                         | Filters on customer name (e.g. admin).                   |
| **users**       | `name`, `email` (FULLTEXT)              | Admin search on customer name/email.                     |
| **products**    | `category_id`, `created_at` (composite) | Catalog: filter by category + sort by date.              |
| **products**    | `name` (FULLTEXT)                       | Product name search (Prisma `search` for longer tokens). |
| **orders**      | `user_id`, `created_at` (composite)     | Order history: by user, newest first.                    |
| **order_items** | `order_id`, `product_id`                | Join lines to orders and products.                       |


**Also:** unique constraints (`email`, `cart.user_id`, `cart_items(cart_id, product_id)`) and primary keys already define indexes.

**Note:** `LIKE '%term%'` / `contains` cannot use a B-tree index well; **FULLTEXT** + `search` is used for product name (and admin user search) when the query is long enough; very short queries still use `contains` as a fallback.