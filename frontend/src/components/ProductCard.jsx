import { useCart } from "../context/CartContext.jsx";

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  return (
    <div className="product-card">
      <div className="product-image-wrap">
        <img src={product.image} alt={product.title} className="product-image" />
      </div>
      <div className="product-body">
        <span className="product-category">{product.category}</span>
        <h3 className="product-title">{product.title}</h3>
        <div className="product-footer">
          <span className="product-price">${product.price.toFixed(2)}</span>
          {product.rating && (
            <span className="product-rating">
              ⭐ {product.rating.rate} ({product.rating.count})
            </span>
          )}
        </div>
        <button
          className="btn-add-cart"
          data-testid={`add-to-cart-${product.id}`}
          onClick={() => addToCart(product.id)}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
