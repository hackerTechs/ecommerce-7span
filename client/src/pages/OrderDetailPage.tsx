import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { orderApi } from "../api/order.api";
import { OrderDetail } from "../components/orders/OrderDetail";
import { Loading } from "../components/common/Loading";
import type { Order } from "../types";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    orderApi
      .getById(Number(id))
      .then((res) => setOrder(res.data.data))
      .catch(() => setOrder(null))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleCancel = useCallback(async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      const res = await orderApi.cancel(order.id);
      setOrder(res.data.data);
      toast.success("Order cancelled successfully");
    } catch(error: unknown) {
      toast.error((error as any)?.response?.data?.message ||"Could not cancel order");
    } finally {
      setIsCancelling(false);
    }
  }, [order]);

  if (isLoading) return <Loading />;

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg mb-4">Order not found</p>
        <Link
          to="/orders"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/orders"
        className="text-indigo-600 hover:text-indigo-700 font-medium mb-4 inline-block"
      >
        &larr; Back to Orders
      </Link>
      <OrderDetail order={order} onCancel={handleCancel} isCancelling={isCancelling} />
    </div>
  );
}
