import { createServer } from "node:http";
import { createSchema, createYoga } from "graphql-yoga";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import fetch from "node-fetch";
import { MOCK_PRODUCTS } from "./mockData.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const typeDefs = readFileSync(join(__dirname, "../schema.graphql"), "utf-8");

const FAKESTORE_BASE = "https://fakestoreapi.com";

// global cart state
let cartItems = [];
let nextItemId = 1;

// helpers for cursor
function encodeCursor(index) {
  return Buffer.from(`product:${index}`).toString("base64");
}

function decodeCursor(cursor) {
  const decoded = Buffer.from(cursor, "base64").toString("utf-8");
  const match = decoded.match(/^product:(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
}

// fetch from fakestore
async function fetchProducts() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${FAKESTORE_BASE}/products`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`FakeStore returned ${res.status}`);
    return res.json();
  } catch (err) {
    console.log("fetching failed, using mock data for now", err);
    return MOCK_PRODUCTS;
  }
}

// resolvers
const resolvers = {
  Query: {
    // Cursor-based pagination
    products: async (_, { first, after }) => {
      const allProducts = await fetchProducts();

      let startIndex = 0;
      if (after) {
        const cursorIndex = decodeCursor(after);
        if (cursorIndex !== null) {
          startIndex = cursorIndex + 1;
        }
      }

      const sliced = allProducts.slice(startIndex, startIndex + first);
      const hasNextPage = startIndex + first < allProducts.length;

      const edges = sliced.map((product, i) => ({
        cursor: encodeCursor(startIndex + i),
        node: product,
      }));

      const endCursor =
        edges.length > 0 ? edges[edges.length - 1].cursor : null;

      return {
        edges,
        pageInfo: { endCursor, hasNextPage },
      };
    },

    // Search products
    productSearch: async (_, { query }) => {
      const allProducts = await fetchProducts();
      const q = query.toLowerCase();
      return allProducts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    },

    // Batch fetch by IDs (DataLoader pattern support)
    productsByIds: async (_, { ids }) => {
      const allProducts = await fetchProducts();
      const idSet = new Set(ids.map(String));
      return allProducts.filter((p) => idSet.has(String(p.id)));
    },

    // Return current cart
    cart: () => ({
      id: "cart-1",
      items: cartItems,
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    }),
  },

  Mutation: {
    addToCart: async (_, { productId }) => {
      // simulate error for product '999' to test rollback
      // console.log("adding to cart", productId);
      if (productId === "999") {
        throw new Error("Product not available");
      }

      const existing = cartItems.find(
        (item) => item.productId === String(productId)
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        cartItems.push({
          id: String(nextItemId++),
          productId: String(productId),
          quantity: 1,
        });
      }

      return {
        id: "cart-1",
        items: cartItems,
        totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    },

    removeFromCart: async (_, { itemId }) => {
      cartItems = cartItems.filter((item) => item.id !== String(itemId));
      return {
        id: "cart-1",
        items: cartItems,
        totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      };
    },
  },

  CartItem: {
    product: async (cartItem) => {
      const allProducts = await fetchProducts();
      return (
        allProducts.find((p) => String(p.id) === String(cartItem.productId)) ||
        null
      );
    },
  },
};

// setup server
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const yoga = createYoga({
  schema: createSchema({ typeDefs, resolvers }),
  cors: {
    origin: [
      FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:80",
    ],
    methods: ["POST", "GET", "OPTIONS"],
    credentials: true,
  },
  graphqlEndpoint: "/graphql",
  landingPage: false,
});

const server = createServer(yoga);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`); // graphql at /graphql
});
