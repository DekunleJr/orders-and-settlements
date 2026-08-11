import { OrderStatus } from "@/types";
import { getStatusLabel } from "@/lib/utils";

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const getModernStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800 border border-gray-200";
      case "partially_paid":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "paid":
        return "bg-green-50 text-green-700 border border-green-200";
      case "overdue":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getModernStatusColor(
        status
      )}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
