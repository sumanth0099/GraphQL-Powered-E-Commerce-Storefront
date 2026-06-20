import { useCart } from "../context/CartContext.jsx";

export default function ErrorToast() {
  const { errorMessage } = useCart();

  if (!errorMessage) return null;

  return (
    <div className="error-toast" data-testid="error-toast" role="alert">
      <span className="error-toast-icon">⚠️</span>
      <span className="error-toast-msg">{errorMessage}</span>
    </div>
  );
}
