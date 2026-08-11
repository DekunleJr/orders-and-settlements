"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SkeletonForm } from "@/components/Skeleton";
import { formatCurrency, toISODateTime } from "@/lib/utils";

interface LineItemForm {
  description: string;
  quantity: string;
  unitPrice: string;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { token, isLoading } = useAuth();
  const [customerName, setCustomerName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItemForm[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: "1", unitPrice: "" }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItemForm, value: string) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const parsedLineItems = lineItems
      .filter((item) => item.description.trim() !== "")
      .map((item) => ({
        description: item.description.trim(),
        quantity: parseInt(item.quantity) || 0,
        unitPrice: parseFloat(item.unitPrice) || 0,
      }));

    if (parsedLineItems.length === 0) {
      setError("At least one line item is required");
      setLoading(false);
      return;
    }

    if (parsedLineItems.some((item) => item.quantity < 1 || item.unitPrice < 0)) {
      setError("Invalid line item values: quantity must be ≥ 1 and unit price must be ≥ 0");
      setLoading(false);
      return;
    }

    try {
      const order = await api.createOrder({
        customerName: customerName.trim(),
        dueDate: toISODateTime(dueDate),
        lineItems: parsedLineItems,
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
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
        <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <SkeletonForm />
        </main>
      </div>
    );
  }

  if (!token) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-blue-600 hover:text-blue-900 font-medium transition-colors">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-bold gradient-text">New Order</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 card-hover">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-6 fade-in">
              <div className="text-sm text-red-700 font-medium">{error}</div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="customerName" className="block text-sm font-semibold text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                id="customerName"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-2">
                Due Date
              </label>
              <input
                id="dueDate"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Line Items
                </label>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="text-sm text-blue-600 hover:text-blue-900 font-medium transition-colors"
                >
                  + Add Item
                </button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-5 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) =>
                            updateLineItem(index, "description", e.target.value)
                          }
                          className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Widget"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) =>
                            updateLineItem(index, "quantity", e.target.value)
                          }
                          className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Unit Price ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateLineItem(index, "unitPrice", e.target.value)
                          }
                          className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    {lineItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 pt-6">
              <div>
                <span className="text-sm text-gray-500 font-medium">Order Total:</span>
                <span className="ml-2 text-2xl font-bold text-gray-900">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-modern inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Order"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}