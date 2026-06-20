import { useState } from "react";
import { useDebounce, useProductSearch } from "../hooks/index.js";
import ProductCard from "./ProductCard.jsx";

export default function SearchBar() {
  const [query, setQuery] = useState("");

  // Debounce: wait 300ms after user stops typing before firing request
  const debouncedQuery = useDebounce(query, 300);
  const { results, loading } = useProductSearch(debouncedQuery);

  return (
    <div className="search-section">
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          data-testid="search-input"
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && <span className="search-spinner">⟳</span>}
        {query && (
          <button
            className="search-clear"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {debouncedQuery && results.length > 0 && (
        <div className="search-results">
          <p className="search-count">
            {results.length} result{results.length !== 1 ? "s" : ""} for "
            {debouncedQuery}"
          </p>
          <div className="product-grid" data-testid="search-results">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {debouncedQuery && !loading && results.length === 0 && (
        <p className="search-empty">No products found for "{debouncedQuery}"</p>
      )}
    </div>
  );
}
