import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import type { Cart } from "../../types";
import { orderApi } from "../../api/order.api";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { formatInr } from "../../utils/formatCurrency";
import { Button } from "../ui";

export interface CartSummaryProps {
  cart: Cart;
}

export function CartSummary({ cart }: CartSummaryProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fetchCart } = useCart();
  const isAdmin = user?.role === "ADMIN";

  const subtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  async function handlePlaceOrder() {
    try {
      const res = await orderApi.placeOrder();
      if (res.data.success) {
        toast.success(res.data.message || "Order placed");
        await fetchCart();
        navigate("/orders");
      } else {
        toast.error(res.data.message || "Order failed");
      }
    } catch {
      toast.error("Could not place order");
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900">Order summary</h2>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-600">Items</dt>
          <dd className="font-medium text-gray-900">{itemCount}</dd>
        </div>
        <div className="flex justify-between text-base">
          <dt className="text-gray-600">Subtotal</dt>
          <dd className="font-bold text-gray-900">{formatInr(subtotal)}</dd>
        </div>
      </dl>
      {isAdmin ? (
        <p className="mt-6 text-sm text-center text-gray-500">Admin accounts cannot place orders.</p>
      ) : (
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          className="mt-6 disabled:bg-gray-400 disabled:hover:bg-gray-400"
          onClick={handlePlaceOrder}
          disabled={cart.items.length === 0}
        >
          Place Order
        </Button>
      )}
    </div>
  );
}
