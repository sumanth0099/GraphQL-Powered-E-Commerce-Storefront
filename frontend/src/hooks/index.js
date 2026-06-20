import { useState, useEffect, useCallback, useRef } from "react";
import { graphqlQuery } from "../utils/graphqlClient.js";

// ─── useDebounce ──────────────────────────────────────────────────────────────
/**
 * Returns a debounced version of `value` that only updates
 * after `delay` ms of no changes.
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ─── useProducts ──────────────────────────────────────────────────────────────
const PRODUCTS_QUERY = `
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          title
          price
          image
          category
          rating { rate count }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

const PAGE_SIZE = 8;

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState({
    hasNextPage: true,
    endCursor: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isFetching = useRef(false);

  const fetchProducts = useCallback(async (cursor = null) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      const data = await graphqlQuery(PRODUCTS_QUERY, {
        first: PAGE_SIZE,
        after: cursor,
      });

      setProducts((prev) => [
        ...prev,
        ...data.products.edges.map((e) => e.node),
      ]);
      setPageInfo(data.products.pageInfo);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    fetchProducts(null);
  }, [fetchProducts]);

  const fetchNextPage = useCallback(() => {
    if (pageInfo.hasNextPage && !loading) {
      fetchProducts(pageInfo.endCursor);
    }
  }, [pageInfo, loading, fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchNextPage,
    hasNextPage: pageInfo.hasNextPage,
  };
}

// ─── useProductSearch ─────────────────────────────────────────────────────────
const SEARCH_QUERY = `
  query ProductSearch($query: String!) {
    productSearch(query: $query) {
      id
      title
      price
      image
      category
      rating { rate count }
    }
  }
`;

export function useProductSearch(debouncedTerm) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!debouncedTerm || debouncedTerm.trim() === "") {
      setResults([]);
      return;
    }

    let cancelled = false;

    async function search() {
      setLoading(true);
      setError(null);
      try {
        const data = await graphqlQuery(SEARCH_QUERY, {
          query: debouncedTerm.trim(),
        });
        if (!cancelled) {
          setResults(data.productSearch);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    search();
    return () => {
      cancelled = true;
    };
  }, [debouncedTerm]);

  return { results, loading, error };
}
