import { useState } from "react";
import { useCart } from "../context/CartContext.jsx";

export default function CartDrawer() {
  const { cart, removeFromCart } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Cart button in header */}
      <button
        className="cart-btn"
        onClick={() => setOpen(true)}
        aria-label="Open cart"
      >
        🛒
        <span className="cart-badge" data-testid="cart-count">
          {cart.totalItems}
        </span>
      </button>

      {/* Drawer overlay */}
      {open && (
        <div className="cart-overlay" onClick={() => setOpen(false)}>
          <div
            className="cart-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cart-header">
              <h2>Your Cart</h2>
              <button
                className="cart-close"
                onClick={() => setOpen(false)}
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            {cart.items.length === 0 ? (
              <div className="cart-empty">
                <p>🛒 Your cart is empty</p>
              </div>
            ) : (
              <ul className="cart-items">
                {cart.items.map((item) => (
                  <li
                    key={item.id}
                    className={`cart-item ${item._optimistic ? "cart-item--optimistic" : ""}`}
                  >
                    <div className="cart-item-info">
                      <span className="cart-item-id">
                        Product #{item.productId}
                      </span>
                      <span className="cart-item-qty">× {item.quantity}</span>
                    </div>
                    {!item._optimistic && (
                      <button
                        className="cart-remove"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="cart-footer">
              <p>
                Total items: <strong>{cart.totalItems}</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
