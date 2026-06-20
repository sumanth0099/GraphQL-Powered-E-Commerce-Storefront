import { useProducts } from "../hooks/index.js";
import ProductCard from "./ProductCard.jsx";

export default function ProductList() {
  const { products, loading, error, fetchNextPage, hasNextPage } =
    useProducts();

  if (error) {
    return (
      <div className="error-message">
        Failed to load products: {error}
      </div>
    );
  }

  return (
    <section>
      {products.length === 0 && loading ? (
        <div className="loading-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : (
        <>
          <div
            className="product-grid"
            data-testid="product-list"
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="load-more-wrap">
            {hasNextPage ? (
              <button
                className="btn-load-more"
                data-testid="next-page-button"
                onClick={fetchNextPage}
                disabled={loading}
              >
                {loading ? "Loading…" : "Load More"}
              </button>
            ) : (
              <p className="all-loaded">✓ All products loaded</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
