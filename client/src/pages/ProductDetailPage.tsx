import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { productApi } from "../api/product.api";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { useSocket } from "../hooks/useSocket";
import { Loading } from "../components/common/Loading";
import { CartQuantityControls } from "../components/cart/CartQuantityControls";
import { Button } from "../components/ui";
import { CartLineQuantityEditor } from "../components/cart/CartLineQuantityEditor";
import { formatInr } from "../utils/formatCurrency";
import type { Product } from "../types";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { user } = useAuth();
  const { cart, addItem } = useCart();
  const isAdmin = user?.role === "ADMIN";
  const { stockUpdates } = useSocket();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!id || !Number.isFinite(productId) || productId < 1) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    productApi
      .getById(productId)
      .then((res) => {
        if (!cancelled) {
          setProduct(res.data.data);
          setQuantity(1);
        }
      })
      .catch(() => {
        if (!cancelled) setProduct(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, productId]);

  useEffect(() => {
    if (!product || stockUpdates.length === 0) return;
    const map = new Map(stockUpdates.map((u) => [u.id, u.stock]));
    const nextStock = map.get(product.id);
    if (nextStock !== undefined) {
      setProduct((p) => (p ? { ...p, stock: nextStock } : null));
    }
  }, [stockUpdates, product?.id]);

  useEffect(() => {
    if (!product) return;
    setQuantity((q) => Math.min(Math.max(1, q), Math.max(1, product.stock)));
  }, [product]);

  async function handleAddToCart() {
    if (!product || product.stock <= 0) return;
    try {
      await addItem(product.id, quantity);
      toast.success(`Added ${quantity} to cart`);
    } catch {
      toast.error("Could not add to cart");
    }
  }

  if (isLoading) return <Loading />;

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg mb-4">Product not found</p>
        <Link to="/products" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Back to products
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;
  const maxQty = product.stock;
  const line = cart?.items.find((i) => i.productId === product.id);

  return (
    <div>
      <Link
        to="/products"
        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm mb-6 inline-block"
      >
        ← Back to products
      </Link>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0 md:gap-8">
          <div className="aspect-square md:aspect-auto md:min-h-[420px] bg-gray-100">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover max-h-[min(100vw,560px)] md:max-h-[560px]"
              />
            ) : (
              <div className="w-full h-full min-h-[280px] flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>

          <div className="p-6 md:p-10 flex flex-col">
            {product.category && (
              <span className="inline-flex self-start text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-3 py-1 mb-3">
                {product.category.name}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{product.name}</h1>
            <p className="mt-4 text-3xl font-bold text-indigo-600">{formatInr(product.price)}</p>
            <p className="mt-2 text-sm text-gray-500">
              {outOfStock ? "Out of stock" : `${product.stock} available`}
            </p>

            {product.description ? (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                  Description
                </h2>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
              </div>
            ) : null}

            <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
              {isAdmin ? (
                <p className="text-sm text-gray-600">Admin accounts cannot add items to the cart or place orders.</p>
              ) : outOfStock ? (
                <p className="text-sm text-gray-600">Out of stock</p>
              ) : line ? (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-medium text-gray-700">Quantity</span>
                  <CartLineQuantityEditor
                    cartItemId={line.id}
                    quantity={line.quantity}
                    maxStock={maxQty}
                    size="md"
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm font-medium text-gray-700">Quantity</span>
                    <CartQuantityControls
                      quantity={quantity}
                      maxQuantity={maxQty}
                      minQuantity={1}
                      onIncrement={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      onDecrement={() => setQuantity((q) => Math.max(1, q - 1))}
                      size="md"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleAddToCart}
                    className="w-full min-w-[200px] md:w-auto"
                  >
                    Add to cart
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
