import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useCart } from "../../hooks/useCart";
import { useDebounce } from "../../hooks/useDebounce";
import {
  CartQuantityControls,
  type CartQuantityControlsSize,
} from "./CartQuantityControls";

export interface CartLineQuantityEditorProps {
  cartItemId: number;
  quantity: number;
  maxStock: number;
  size?: CartQuantityControlsSize;
  className?: string;
  onLocalQuantityChange?: (qty: number) => void;
}

/**
 * Keeps quantity in sync with the server via debounced PATCH, matching cart line behavior.
 */
export function CartLineQuantityEditor({
  cartItemId,
  quantity,
  maxStock,
  size = "sm",
  className,
  onLocalQuantityChange,
}: CartLineQuantityEditorProps) {
  const { updateItem, removeItem } = useCart();
  const [localQty, setLocalQty] = useState(quantity);
  const debouncedQty = useDebounce(localQty, 500);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setLocalQty(quantity);
  }, [quantity]);

  useEffect(() => {
    onLocalQuantityChange?.(localQty);
  }, [localQty, onLocalQuantityChange]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (debouncedQty === quantity) return;

    void updateItem(cartItemId, debouncedQty).catch(() => {
      toast.error("Could not update quantity");
      setLocalQty(quantity);
    });
  }, [debouncedQty]);

  function handleIncrement() {
    setLocalQty((q) => (q < maxStock ? q + 1 : q));
  }

  function handleDecrement() {
    setLocalQty((q) => (q > 1 ? q - 1 : q));
  }

  async function handleRemove() {
    try {
      await removeItem(cartItemId);
    } catch {
      toast.error("Could not remove item");
    }
  }

  return (
    <CartQuantityControls
      quantity={localQty}
      maxQuantity={maxStock}
      minQuantity={1}
      onIncrement={handleIncrement}
      onDecrement={handleDecrement}
      onRemove={handleRemove}
      size={size}
      className={className}
    />
  );
}
