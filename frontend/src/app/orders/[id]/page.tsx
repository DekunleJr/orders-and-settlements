"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Order, AuditLog } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import PaymentModal from "@/components/PaymentModal";
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-blue-600 hover:text-blue-900">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Order Details</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{order.customerName}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Created {formatDateTime(order.createdAt)}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-200">
            <div>
              <p className="text-sm text-gray-500">Order Total</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(order.orderTotal)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount Paid</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(order.amountPaid)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount Due</p>
              <p className={`text-xl font-bold ${(order.amountDue ?? 0) <= 0 ? "text-green-600" : "text-red-600"}`}>
                {formatCurrency(order.amountDue)}
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="text-lg font-medium text-gray-900">{formatDate(order.dueDate)}</p>
          </div>

          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Line Items</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.lineItems?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-900">Payment History</h3>
              <div className="flex space-x-2">
                {!isFullyPaid && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Record Payment
                  </button>
                )}
                {(order.amountPaid ?? 0) > 0 && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {showAuditLog ? "Hide Audit Log" : "Show Audit Log"}
                </button>
              </div>
            </div>

            {order.payments && order.payments.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(payment.date)}</td>
                      <td className={`px-4 py-3 text-sm font-medium ${payment.amount < 0 ? "text-red-600" : "text-gray-900"}`}>
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {payment.isRefund ? (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Refund</span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Payment</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{payment.note || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500">No payments recorded yet</p>
            )}
          </div>
        </div>
      </main>

      {showPaymentModal && (
        <PaymentModal
          orderId={order.id}
          amountDue={order.amountDue ?? 0}
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