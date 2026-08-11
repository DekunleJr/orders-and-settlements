import React from "react";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton rounded ${className || ""}`} style={style} />;
}

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return <Skeleton className={`rounded-full`} style={{ width: size, height: size }} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white shadow-lg rounded-2xl p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex space-x-4 pt-4">
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
        <Skeleton className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-linear-to-r from-gray-50 to-slate-50">
            <tr>
              {["Customer", "Status", "Order Total", "Amount Paid", "Amount Due", "Due Date", "Actions"].map((header) => (
                <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-16" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-4 w-24" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Skeleton className="h-8 w-24 rounded-md" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-5 space-y-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="sm:col-span-2 space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-40 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden space-y-0">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-linear-to-r from-gray-50 to-slate-50">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* Stats */}
      <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-gray-200">
        <div className="bg-blue-50 rounded-xl p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="bg-green-50 rounded-xl p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="bg-red-50 rounded-xl p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Due Date */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Line Items */}
      <div className="px-6 py-5 border-b border-gray-200 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-linear-to-r from-gray-50 to-slate-50">
              <tr>
                {["Description", "Qty", "Unit Price", "Subtotal"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-40" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-8" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-16" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment History */}
      <div className="px-6 py-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-linear-to-r from-gray-50 to-slate-50">
              <tr>
                {["Date", "Amount", "Type", "Note"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 2 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}