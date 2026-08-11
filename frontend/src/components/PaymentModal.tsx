"use client";

import { useState, FormEvent } from "react";
import { api } from "@/lib/api";
import { formatCurrency, toISODateTime } from "@/lib/utils";

interface PaymentModalProps {
  orderId: string;
  amountDue: number;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "payment" | "refund";
}

export default function PaymentModal({ orderId, amountDue, onClose, onSuccess, mode = "payment" }: PaymentModalProps) {
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
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${mode}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <span className="text-sm text-gray-600">{isRefund ? "Refundable Amount: " : "Amount Due: "}</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(amountDue)}</span>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-3 mb-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{isRefund ? "Refund Amount ($)" : "Amount ($)"}</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder={isRefund ? "Refund reason" : "Payment note"}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : buttonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}