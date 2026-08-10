import { format, parseISO } from "date-fns";
import { OrderStatus } from "@/types";

export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), "MMM d, yyyy");
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), "MMM d, yyyy h:mm a");
  } catch {
    return dateString;
  }
}

export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "bg-gray-100 text-gray-800";
    case "partially_paid":
      return "bg-blue-100 text-blue-800";
    case "paid":
      return "bg-green-100 text-green-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "partially_paid":
      return "Partially Paid";
    case "paid":
      return "Paid";
    case "overdue":
      return "Overdue";
    default:
      return "Pending";
  }
}

export function toISODateTime(date: string): string {
  // If it's just a date (YYYY-MM-DD), add end of day time
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `${date}T23:59:59Z`;
  }

  // If it's a datetime-local value (YYYY-MM-DDTHH:mm), add seconds and timezone
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(date)) {
    return `${date}:59Z`;
  }

  // If it already has seconds but no timezone
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(date)) {
    return `${date}Z`;
  }

  // If it already has full ISO format with timezone, return as is
  if (date.includes("T") && date.includes("Z")) return date;

  // Fallback: convert to ISO
  return new Date(date).toISOString();
}
