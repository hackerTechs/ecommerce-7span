import {
  createContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { cartApi } from "../api/cart.api";
import { useSocket } from "../hooks/useSocket";
import type { Cart } from "../types";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: number, quantity: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearLocalCart: () => void;
}

export const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { stockUpdates } = useSocket();

  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await cartApi.getCart();
      setCart(res.data.data);
    } catch {
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addItem = useCallback(async (productId: number, quantity: number) => {
    const res = await cartApi.addItem(productId, quantity);
    setCart(res.data.data);
  }, []);

  const updateItem = useCallback(async (itemId: number, quantity: number) => {
    const res = await cartApi.updateItem(itemId, quantity);
    setCart(res.data.data);
  }, []);

  const removeItem = useCallback(async (itemId: number) => {
    const res = await cartApi.removeItem(itemId);
    setCart(res.data.data);
  }, []);

  const clearLocalCart = useCallback(() => {
    setCart(null);
  }, []);

  useEffect(() => {
    if (stockUpdates.length === 0 || !cart) return;
    const map = new Map(stockUpdates.map((u) => [u.id, u.stock]));
    setCart((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((item) => {
        const newStock = map.get(item.productId);
        if (newStock === undefined) return item;
        return { ...item, product: { ...item.product, stock: newStock } };
      });
      return { ...prev, items: updatedItems };
    });
  }, [stockUpdates]);

  return (
    <CartContext.Provider
      value={{ cart, isLoading, fetchCart, addItem, updateItem, removeItem, clearLocalCart }}
    >
      {children}
    </CartContext.Provider>
  );
}
