import { createContext, useContext, useReducer, useCallback } from "react";
import { graphqlQuery } from "../utils/graphqlClient.js";

const CartContext = createContext(null);

// ─── Reducer ─────────────────────────────────────────────────────────────────
const ADD_OPTIMISTIC = "ADD_OPTIMISTIC";
const CONFIRM_ADD = "CONFIRM_ADD";
const ROLLBACK_ADD = "ROLLBACK_ADD";
const REMOVE_ITEM = "REMOVE_ITEM";
const SET_CART = "SET_CART";

function cartReducer(state, action) {
  switch (action.type) {
    case ADD_OPTIMISTIC: {
      // Immediately add a temporary item
      const tempItem = {
        id: action.tempId,
        productId: String(action.productId),
        quantity: 1,
        _optimistic: true,
      };
      return {
        ...state,
        items: [...state.items, tempItem],
        totalItems: state.totalItems + 1,
      };
    }

    case CONFIRM_ADD: {
      // Replace temp item with real server data
      return {
        ...state,
        items: action.cart.items,
        totalItems: action.cart.totalItems,
      };
    }

    case ROLLBACK_ADD: {
      // Remove the temporary item (server error)
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.tempId),
        totalItems: Math.max(0, state.totalItems - 1),
      };
    }

    case REMOVE_ITEM: {
      return {
        ...state,
        items: action.cart.items,
        totalItems: action.cart.totalItems,
      };
    }

    case SET_CART:
      return { ...state, ...action.cart };

    default:
      return state;
  }
}

// ─── GraphQL mutations ────────────────────────────────────────────────────────
const ADD_TO_CART_MUTATION = `
  mutation AddToCart($productId: ID!) {
    addToCart(productId: $productId) {
      id
      items { id productId quantity }
      totalItems
    }
  }
`;

const REMOVE_FROM_CART_MUTATION = `
  mutation RemoveFromCart($itemId: ID!) {
    removeFromCart(itemId: $itemId) {
      id
      items { id productId quantity }
      totalItems
    }
  }
`;

// ─── Provider ─────────────────────────────────────────────────────────────────
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, {
    id: "cart-1",
    items: [],
    totalItems: 0,
  });

  const [errorMessage, setErrorMessage] = useReducer((_, msg) => msg, null);

  const showError = useCallback((msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  }, []);

  const addToCart = useCallback(
    async (productId) => {
      const tempId = `temp-${Date.now()}-${Math.random()}`;

      // 1. Optimistic update — update UI immediately
      dispatch({ type: ADD_OPTIMISTIC, productId, tempId });

      try {
        // 2. Send mutation in background
        const data = await graphqlQuery(ADD_TO_CART_MUTATION, {
          productId: String(productId),
        });

        // 3. Success — replace optimistic item with server data
        dispatch({ type: CONFIRM_ADD, cart: data.addToCart });
      } catch (err) {
        // 4. Failure — rollback and show error
        dispatch({ type: ROLLBACK_ADD, tempId });
        showError(err.message || "Failed to add item to cart");
      }
    },
    [showError]
  );

  const removeFromCart = useCallback(async (itemId) => {
    try {
      const data = await graphqlQuery(REMOVE_FROM_CART_MUTATION, {
        itemId: String(itemId),
      });
      dispatch({ type: REMOVE_ITEM, cart: data.removeFromCart });
    } catch (err) {
      console.error("Remove from cart failed:", err);
    }
  }, []);

  return (
    <CartContext.Provider
      value={{ cart: state, addToCart, removeFromCart, errorMessage }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
