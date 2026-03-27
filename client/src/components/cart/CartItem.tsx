import { useState, useEffect } from "react";
import type { CartItem as CartItemType } from "../../types";
import { formatInr } from "../../utils/formatCurrency";
import { CartLineQuantityEditor } from "./CartLineQuantityEditor";

export interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { product } = item;
  const maxQty = product.stock;
  const [lineQty, setLineQty] = useState(item.quantity);
  useEffect(() => {
    setLineQty(item.quantity);
  }, [item.quantity]);
  const lineTotal = Number(product.price) * lineQty;

  return (
    <div className="flex items-center gap-4 border-b border-gray-200 px-4 py-4 last:border-b-0">
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-20 w-20 shrink-0 rounded object-cover"
        />
      ) : (
        <div className="h-20 w-20 shrink-0 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-500">
          No image
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 truncate">{product.name}</p>
        <p className="text-sm text-gray-600">{formatInr(product.price)} each</p>
        <p className="text-xs text-gray-400">{maxQty} available</p>
      </div>
      <CartLineQuantityEditor
        cartItemId={item.id}
        quantity={item.quantity}
        maxStock={maxQty}
        size="sm"
        onLocalQuantityChange={setLineQty}
      />
      <p className="w-24 text-right font-semibold text-gray-900 shrink-0">
        {formatInr(lineTotal)}
      </p>
    </div>
  );
}
