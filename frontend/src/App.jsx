import { CartProvider } from "./context/CartContext.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import SearchBar from "./components/SearchBar.jsx";
import ProductList from "./components/ProductList.jsx";
import ErrorToast from "./components/ErrorToast.jsx";

// Initialize DataLoader (exposes window.triggerBatchFetch)
import "./utils/dataLoader.js";

export default function App() {
  return (
    <CartProvider>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-inner">
            <div className="logo">
              <span className="logo-icon">🛍️</span>
              <span className="logo-text">GraphQL Store</span>
            </div>
            <SearchBar />
            <CartDrawer />
          </div>
        </header>

        {/* Main content */}
        <main className="main">
          <div className="container">
            <h1 className="page-title">All Products</h1>
            <ProductList />
          </div>
        </main>

        {/* Error toast for optimistic UI rollback */}
        <ErrorToast />
      </div>
    </CartProvider>
  );
}
