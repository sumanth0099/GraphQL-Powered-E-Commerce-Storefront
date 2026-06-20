# GraphQL-Powered E-Commerce Storefront

A high-performance e-commerce storefront built with a **custom lightweight GraphQL client** (no Apollo, no Relay, no react-query). Demonstrates cursor-based pagination, optimistic UI updates, request batching via a custom DataLoader, and debounced search — all from scratch.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18 + Vite (served via nginx)  |
| Backend   | Node.js + GraphQL Yoga              |
| Data      | FakeStore REST API (wrapped in GQL) |
| Container | Docker + Docker Compose             |

---

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd graphql-store

# 2. Copy env vars
cp .env.example .env

# 3. Run everything
docker-compose up --build
```

The frontend will be available at **http://localhost:5173**  
The GraphQL API will be available at **http://localhost:4000/graphql**

Both containers must be healthy before the frontend starts (enforced via `depends_on: condition: service_healthy`).

---

## Architecture

```
Browser
  │
  ▼
┌─────────────────────────────┐
│  Frontend (React + Vite)    │  :5173
│  - Custom GraphQL client    │
│  - useProducts hook         │
│  - useDebounce hook         │
│  - useProductSearch hook    │
│  - useCart + CartContext    │
│  - DataLoader (batching)    │
└────────────┬────────────────┘
             │ POST /graphql
             ▼
┌─────────────────────────────┐
│  API (Node.js + GQL Yoga)   │  :4000
│  - schema.graphql           │
│  - Cursor-based pagination  │
│  - In-memory cart store     │
└────────────┬────────────────┘
             │ REST
             ▼
      FakeStore API
   fakestoreapi.com
```

---

## Core Features

### 1. Cursor-Based Pagination
Products are fetched 8 at a time. Each page returns an `endCursor` and `hasNextPage`. Clicking "Load More" sends the cursor to fetch the next page and appends results — no duplicates, no missed items.

```graphql
query {
  products(first: 8, after: "<cursor>") {
    edges { cursor node { id title price } }
    pageInfo { endCursor hasNextPage }
  }
}
```

### 2. Debounced Search (300ms)
The search input uses a `useDebounce` hook. The GraphQL `productSearch` query only fires 300ms after the user stops typing — not on every keystroke.

```graphql
query {
  productSearch(query: "shoe") {
    id title price image
  }
}
```

### 3. Optimistic UI (Cart)
When "Add to Cart" is clicked:
1. Cart count increments **immediately** (optimistic update)
2. `addToCart` mutation fires in the background
3. On success → server data replaces the temp item
4. On failure → temp item is removed (**rollback**) and an error toast appears

Test the rollback by adding product ID `999` — the server throws an error, and the UI rolls back.

### 4. DataLoader (Batch Fetching)
`productLoader.load(id)` collects all IDs called in the same event loop tick and sends a **single** `productsByIds` query instead of N individual requests.

**Test it from the browser console:**
```js
window.triggerBatchFetch()
// Triggers 3 load() calls → only 1 network request
```

---

## GraphQL Schema

```graphql
type Query {
  products(first: Int!, after: String): ProductConnection!
  productSearch(query: String!): [Product]!
  productsByIds(ids: [ID!]!): [Product]!
  cart: Cart!
}

type Mutation {
  addToCart(productId: ID!): Cart!
  removeFromCart(itemId: ID!): Cart!
}
```

---

## Verifying Requirements

### Pagination
```bash
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ products(first: 5) { edges { cursor node { id title } } pageInfo { endCursor hasNextPage } } }"}' \
  | jq .
```

### Introspection
```bash
curl -s -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } } }"}' \
  | jq .
```

### Optimistic UI rollback
1. Open the app
2. Click "Add to Cart" on any product with ID `999` (or trigger via devtools)
3. Watch cart count increment then revert, with a red toast

---

## Environment Variables

See `.env.example` for all variables:

| Variable       | Default                        | Description                     |
|----------------|--------------------------------|---------------------------------|
| `API_PORT`     | `4000`                         | Port for the GraphQL API        |
| `FRONTEND_URL` | `http://localhost:5173`        | CORS allowed origin             |
| `FRONTEND_PORT`| `5173`                         | Port for the frontend           |
| `VITE_API_URL` | `http://localhost:4000/graphql`| GraphQL endpoint (frontend)     |

---

## Project Structure

```
graphql-store/
├── docker-compose.yml
├── .env.example
├── docs/
│   └── adr-caching-strategy.md
├── api/
│   ├── Dockerfile
│   ├── package.json
│   ├── schema.graphql
│   └── src/
│       └── index.js
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── context/
        │   └── CartContext.jsx      ← Optimistic UI + rollback
        ├── hooks/
        │   └── index.js             ← useProducts, useDebounce, useProductSearch
        ├── utils/
        │   ├── graphqlClient.js     ← Lightweight fetch wrapper
        │   └── dataLoader.js        ← Batch request DataLoader
        └── components/
            ├── ProductList.jsx      ← Paginated product grid
            ├── ProductCard.jsx      ← Individual product + add-to-cart
            ├── SearchBar.jsx        ← Debounced search
            ├── CartDrawer.jsx       ← Slide-in cart UI
            └── ErrorToast.jsx       ← Rollback notification
```
