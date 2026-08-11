export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LineItem {
  id: string;
  orderId: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  isRefund: boolean;
  date: string;
  note: string | null;
  createdAt: string;
}

export type OrderStatus = "pending" | "partially_paid" | "paid" | "overdue";

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  dueDate: string;
  status: OrderStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  lineItems?: LineItem[];
  payments?: Payment[];
  orderTotal?: number;
  amountPaid?: number;
  amountDue?: number;
}

export interface CreateOrderInput {
  customerName: string;
  dueDate: string;
  lineItems: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface UpdateOrderInput {
  customerName?: string;
  dueDate?: string;
  lineItems?: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export interface CreatePaymentInput {
  amount: number;
  date?: string;
  note?: string;
  isRefund?: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  orderId: string;
  userId: string;
  oldStatus: string | null;
  newStatus: string;
  changedAt: string;
}
