"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Order, OrderStatus } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { SkeletonTable } from "@/components/Skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusFilters: (OrderStatus | "all")[] = [
  "all",
  "pending",
  "partially_paid",
  "paid",
  "overdue",
];

export default function DashboardPage() {
  const { user, token, isLoading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/login");
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    let isMounted = true;

    if (token) {
      api
        .getOrders(filter === "all" ? undefined : filter)
        .then((data) => {
          if (isMounted) {
            setOrders(data);
            setError("");
          }
        })
        .catch((err) => {
          if (isMounted) {
            setError(err instanceof Error ? err.message : "Failed to fetch orders");
          }
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [token, filter, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50">
        <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="h-6 w-6 rounded-full animate-spin border-2 border-blue-600 border-t-transparent" />
              <div className="flex items-center space-x-4">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-10 w-28 rounded-lg" />
                <div className="skeleton h-4 w-16 rounded" />
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <div className="mb-6 space-y-4">
              <div className="skeleton h-8 w-32 rounded" />
              <div className="flex space-x-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton h-9 w-28 rounded-lg" />
                ))}
              </div>
            </div>
            <SkeletonTable rows={5} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold gradient-text">Orders & Settlements</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 font-medium">{user?.email}</span>
              <Link
                href="/orders/new"
                className="btn-modern inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Order
              </Link>
              <button
                onClick={logout}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex items-center justify-between mb-6 fade-in">
            <h2 className="text-3xl font-bold text-gray-900">Orders</h2>
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                {statusFilters.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setLoading(true);
                      setFilter(status);
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      filter === status
                        ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                        : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {status === "all"
                      ? "All"
                      : status === "partially_paid"
                      ? "Partially Paid"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={async () => {
                  try {
                    api.exportOrdersToCSV(orders);
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to export orders");
                  }
                }}
                className="btn-modern px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {loading ? (
            <SkeletonTable rows={5} />
          ) : orders.length === 0 ? (
            <div className="bg-white shadow-lg rounded-2xl p-12 text-center card-hover">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg mb-4">No orders found</p>
              <Link
                href="/orders/new"
                className="btn-modern inline-flex items-center px-6 py-3 text-sm font-medium rounded-lg text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create your first order
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow-lg rounded-2xl overflow-hidden card-hover">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-linear-to-r from-gray-50 to-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Order Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount Paid
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount Due
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order, index) => (
                      <tr key={order.id} className="table-row-hover fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {order.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(order.orderTotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatCurrency(order.amountPaid)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(order.amountDue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(order.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link
                            href={`/orders/${order.id}`}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          >
                            View Details
                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}