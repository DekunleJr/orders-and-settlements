"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Order, AuditLog } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import PaymentModal from "@/components/PaymentModal";
import { SkeletonDetail } from "@/components/Skeleton";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, isLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const fetchOrder = () => {
    if (!token || !params.id) return;
    api
      .getOrder(params.id as string)
      .then((data) => {
        setOrder(data);
        setError("");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to fetch order");
      })
      .finally(() => setLoading(false));
  };

  const fetchAuditLog = async () => {
    if (!token || !params.id) return;
    try {
      const logs = await api.getAuditLog(params.id as string);
      setAuditLogs(logs);
    } catch (err) {
      console.error("Failed to fetch audit log:", err);
    }
  };

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/login");
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    fetchOrder();
  }, [token, params.id]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50">
        <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="h-6 w-6 rounded-full animate-spin border-2 border-blue-600 border-t-transparent" />
              <div className="flex items-center space-x-4">
                <div className="skeleton h-4 w-40 rounded" />
                <div className="skeleton h-4 w-32 rounded" />
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <SkeletonDetail />
        </main>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!order) return null;

  const isFullyPaid = (order.amountDue ?? 0) <= 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-blue-600 hover:text-blue-900 font-medium transition-colors">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold gradient-text">Order Details</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6 fade-in">
            <div className="text-sm text-red-700 font-medium">{error}</div>
          </div>
        )}

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden card-hover">
          <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-linear-to-r from-gray-50 to-slate-50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{order.customerName}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Created {formatDateTime(order.createdAt)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-200">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm text-blue-600 font-medium">Order Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(order.orderTotal)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-sm text-green-600 font-medium">Amount Paid</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(order.amountPaid)}</p>
            </div>
            <div className={`rounded-xl p-4 ${(order.amountDue ?? 0) <= 0 ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`text-sm font-medium ${(order.amountDue ?? 0) <= 0 ? "text-green-600" : "text-red-600"}`}>Amount Due</p>
              <p className={`text-2xl font-bold mt-1 ${(order.amountDue ?? 0) <= 0 ? "text-green-700" : "text-red-700"}`}>
                {formatCurrency(order.amountDue)}
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500 font-medium">Due Date</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{formatDate(order.dueDate)}</p>
          </div>

          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Line Items</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-linear-to-r from-gray-50 to-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {order.lineItems?.map((item) => (
                    <tr key={item.id} className="table-row-hover">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
              <div className="flex space-x-2">
                {!isFullyPaid && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="btn-modern px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Record Payment
                  </button>
                )}
                {(order.amountPaid ?? 0) > 0 && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="btn-modern px-4 py-2 text-sm font-medium text-white bg-linear-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-lg shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40"
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Record Refund
                  </button>
                )}
                <button
                  onClick={() => {
                    if (!showAuditLog) {
                      fetchAuditLog();
                    }
                    setShowAuditLog(!showAuditLog);
                  }}
                  className="btn-modern px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {showAuditLog ? "Hide Audit Log" : "Show Audit Log"}
                </button>
              </div>
            </div>

            {order.payments && order.payments.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-linear-to-r from-gray-50 to-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Note</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order.payments.map((payment) => (
                      <tr key={payment.id} className="table-row-hover">
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(payment.date)}</td>
                        <td className={`px-4 py-3 text-sm font-semibold ${payment.amount < 0 ? "text-red-600" : "text-gray-900"}`}>
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {payment.isRefund ? (
                            <span className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">Refund</span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">Payment</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{payment.note || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">No payments recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showPaymentModal && (
        <PaymentModal
          orderId={order.id}
          amountDue={order.amountDue ?? 0}
          orderVersion={order.version}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            fetchOrder();
          }}
        />
      )}

      {showRefundModal && (
        <PaymentModal
          orderId={order.id}
          amountDue={order.amountPaid ?? 0}
          orderVersion={order.version}
          mode="refund"
          onClose={() => setShowRefundModal(false)}
          onSuccess={() => {
            setShowRefundModal(false);
            fetchOrder();
          }}
        />
      )}

      {showAuditLog && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Audit Log</h3>
              <button onClick={() => setShowAuditLog(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            {auditLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No status changes recorded</p>
            ) : (
              <div className="space-y-3">
            {auditLogs.map((log: AuditLog) => (
                  <div key={log.id} className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {log.oldStatus || "N/A"}
                        </span>
                        <span className="text-gray-500">→</span>
                        <span className="text-sm font-medium text-gray-900">{log.newStatus}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.changedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}