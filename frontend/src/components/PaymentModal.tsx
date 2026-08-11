"use client";

import { useState, FormEvent } from "react";
import { api } from "@/lib/api";
import { formatCurrency, toISODateTime } from "@/lib/utils";

interface PaymentModalProps {
  orderId: string;
  amountDue: number;
  orderVersion: number;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "payment" | "refund";
}

export default function PaymentModal({ orderId, amountDue, orderVersion, onClose, onSuccess, mode = "payment" }: PaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isRefund = mode === "refund";
  const maxAmount = isRefund ? amountDue : amountDue;
  const title = isRefund ? "Record Refund" : "Record Payment";
  const buttonText = isRefund ? "Record Refund" : "Record Payment";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0");
      setLoading(false);
      return;
    }

    if (parsedAmount > maxAmount) {
      setError(`Amount cannot exceed ${formatCurrency(maxAmount)}`);
      setLoading(false);
      return;
    }

    try {
      await api.createPayment(orderId, {
        amount: parsedAmount,
        date: date ? toISODateTime(date) : undefined,
        note: note || undefined,
        isRefund,
      }, orderVersion);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full fade-in">
        <div className="flex items-center justify-between mb-6 p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl">
          <span className="text-sm text-gray-600 font-medium">{isRefund ? "Refundable Amount: " : "Amount Due: "}</span>
          <span className="text-2xl font-bold text-gray-900 ml-2">{formatCurrency(amountDue)}</span>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6 mx-6 fade-in">
            <div className="text-sm text-red-700 font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">{isRefund ? "Refund Amount ($)" : "Amount ($)"}</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder={isRefund ? "Refund reason" : "Payment note"}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`btn-modern px-5 py-2.5 text-sm font-medium text-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                isRefund
                  ? "bg-linear-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-red-500/30 hover:shadow-red-500/40"
                  : "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30 hover:shadow-blue-500/40"
              }`}
            >
              {loading ? "Processing..." : buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}