import type { Order } from "../../types";
import { formatInr } from "../../utils/formatCurrency";
import { Button } from "../ui";

export interface OrderDetailProps {
  order: Order;
  onCancel?: () => void;
  isCancelling?: boolean;
}

const statusStyles: Record<Order["status"], string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export function OrderDetail({ order, onCancel, isCancelling }: OrderDetailProps) {
  const formattedDate = new Date(order.createdAt).toLocaleString(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order #{order.id}</h1>
            <p className="mt-1 text-sm text-gray-600">{formattedDate}</p>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusStyles[order.status]}`}
          >
            {order.status}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left font-semibold text-gray-700">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-right font-semibold text-gray-700">
                Unit price
              </th>
              <th scope="col" className="px-6 py-3 text-right font-semibold text-gray-700">
                Qty
              </th>
              <th scope="col" className="px-6 py-3 text-right font-semibold text-gray-700">
                Line total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.items.map((line) => {
              const lineTotal = Number(line.unitPrice) * line.quantity;
              return (
                <tr key={line.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {line.product.imageUrl ? (
                        <img
                          src={line.product.imageUrl}
                          alt={line.product.name}
                          className="h-12 w-12 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-gray-200 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{line.product.name}</p>
                        {line.product.description ? (
                          <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">
                            {line.product.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-700 whitespace-nowrap">
                    {formatInr(line.unitPrice)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-700">{line.quantity}</td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-900 whitespace-nowrap">
                    {formatInr(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        {order.status === "PENDING" && onCancel ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onCancel}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelling..." : "Cancel Order"}
          </Button>
        ) : (
          <div />
        )}
        <p className="text-lg font-bold text-gray-900">
          Total: {formatInr(order.totalAmount)}
        </p>
      </div>
    </div>
  );
}
