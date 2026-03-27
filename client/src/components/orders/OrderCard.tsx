import { Link } from "react-router-dom";
import type { Order } from "../../types";
import { formatInr } from "../../utils/formatCurrency";

export interface OrderCardProps {
  order: Order;
}

const statusStyles: Record<Order["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function OrderCard({ order }: OrderCardProps) {
  const itemCount = order.items.reduce((sum, line) => sum + line.quantity, 0);
  const formattedDate = new Date(order.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Link
      to={`/orders/${order.id}`}
      className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition cursor-pointer text-left"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-gray-500">Order</p>
          <p className="font-semibold text-gray-900">#{order.id}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[order.status]}`}
        >
          {order.status}
        </span>
      </div>
      <p className="mt-3 text-sm text-gray-600">{formattedDate}</p>
      <div className="mt-4 flex justify-between text-sm">
        <span className="text-gray-600">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
        <span className="font-bold text-indigo-600">{formatInr(order.totalAmount)}</span>
      </div>
    </Link>
  );
}
