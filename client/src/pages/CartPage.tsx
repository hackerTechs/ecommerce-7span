import { useEffect } from "react";
import { useCart } from "../hooks/useCart";
import { CartItem } from "../components/cart/CartItem";
import { CartSummary } from "../components/cart/CartSummary";
import { Loading } from "../components/common/Loading";
import { Link } from "react-router-dom";
import { buttonClassNames } from "../components/ui";

export function CartPage() {
  const { cart, isLoading, fetchCart } = useCart();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (isLoading) return <Loading />;

  const hasItems = cart && cart.items.length > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>

      {!hasItems ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
          <Link
            to="/products"
            className={`${buttonClassNames({ variant: "primary", size: "lg" })} px-6`}
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow">
              {cart.items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          </div>
          <div>
            <CartSummary cart={cart} />
          </div>
        </div>
      )}
    </div>
  );
}
