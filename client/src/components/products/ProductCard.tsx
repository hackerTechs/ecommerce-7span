import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import type { Product } from "../../types";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";
import { formatInr } from "../../utils/formatCurrency";
import { CartLineQuantityEditor } from "../cart/CartLineQuantityEditor";
import { Button } from "../ui";

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { cart, addItem } = useCart();
  const outOfStock = product.stock <= 0;
  const isAdmin = user?.role === "ADMIN";
  const line = cart?.items.find((i) => i.productId === product.id);

  async function handleAddToCart() {
    if (outOfStock) return;
    try {
      await addItem(product.id, 1);
      toast.success("Added to cart");
    } catch {
      toast.error("Could not add to cart");
    }
  }

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition flex flex-col">
      <Link
        to={`/products/${product.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-inset"
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div
            className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 text-sm"
            aria-hidden
          >
            No image
          </div>
        )}
        <div className="p-4 pb-2">
          {product.category && (
            <span className="inline-block line-clamp-1 max-w-[100px] text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-0.5 mb-2">
              {product.category.name}
            </span>
          )}
          <h3 className="font-semibold text-gray-900 line-clamp-1 hover:text-indigo-700">{product.name}</h3>
          {product.description != null && product.description !== "" ? (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{product.description}</p>
          ) : null}
          <p className="mt-2 text-lg font-bold text-indigo-600">{formatInr(product.price)}</p>
          <p className="mt-1 text-sm text-gray-500">
            {outOfStock ? "Out of stock" : `${product.stock} in stock`}
          </p>
          <p className="mt-2 text-xs font-medium text-indigo-600">View details →</p>
        </div>
      </Link>
      <div className="px-4 pb-4 mt-auto">
        {isAdmin ? (
          <p className="text-center text-sm text-gray-500 py-2">Admin — shopping is disabled</p>
        ) : outOfStock ? (
          <p className="text-center text-sm text-gray-500 py-2">Out of stock</p>
        ) : line ? (
          <div className="flex justify-center pt-1">
            <CartLineQuantityEditor
              cartItemId={line.id}
              quantity={line.quantity}
              maxStock={product.stock}
              size="sm"
            />
          </div>
        ) : (
          <Button type="button" variant="primary" fullWidth onClick={handleAddToCart}>
            Add to Cart
          </Button>
        )}
      </div>
    </article>
  );
}
