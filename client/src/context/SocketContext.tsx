import { createContext, useEffect, useRef, useState, type ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface StockUpdate {
  id: number;
  stock: number;
}

interface SocketContextType {
  stockUpdates: StockUpdate[];
}

export const SocketContext = createContext<SocketContextType>({ stockUpdates: [] });

export function SocketProvider({ children }: { children: ReactNode }) {
  const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(window.location.origin, { withCredentials: true });
    socketRef.current = socket;

    socket.on("stock:update", (updates: StockUpdate[]) => {
      setStockUpdates(updates);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={{ stockUpdates }}>
      {children}
    </SocketContext.Provider>
  );
}
