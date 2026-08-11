import Papa from "papaparse";
import { AuthResponse, CreateOrderInput, CreatePaymentInput, Order, UpdateOrderInput, ApiError, Payment, AuditLog } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers ? (options.headers as Record<string, string>) : {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const error: ApiError = errorData || {
        error: "Request Failed",
        message: `Request failed with status ${response.status}`,
      };
      throw new Error(error.message || error.error);
    }

    return response.json() as Promise<T>;
  }

  // Auth
  async signup(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // Orders
  async getOrders(status?: string): Promise<Order[]> {
    const query = status ? `?status=${status}` : "";
    return this.request<Order[]>(`/api/orders${query}`);
  }

  async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}`);
  }

  async createOrder(input: CreateOrderInput): Promise<Order> {
    return this.request<Order>("/api/orders", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async updateOrder(id: string, input: UpdateOrderInput): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  async deleteOrder(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/orders/${id}`, {
      method: "DELETE",
    });
  }

  // Payments
  async createPayment(orderId: string, input: CreatePaymentInput): Promise<Payment> {
    return this.request<Payment>(`/api/orders/${orderId}/payments`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async createRefund(orderId: string, input: CreatePaymentInput): Promise<Payment> {
    return this.request<Payment>(`/api/orders/${orderId}/payments`, {
      method: "POST",
      headers: {
        "X-Order-Version": "0",
      },
      body: JSON.stringify({ ...input, isRefund: true }),
    });
  }

  async getAuditLog(orderId: string): Promise<AuditLog[]> {
    return this.request<AuditLog[]>(`/api/orders/${orderId}/audit-log`);
  }

  exportOrdersToCSV(orders: Order[]): void {
    if (orders.length === 0) {
      throw new Error("No orders to export");
    }

    const csvData = orders.map((order) => {
      const orderTotal = order.lineItems?.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      ) || 0;
      
      const amountPaid = order.payments?.reduce(
        (sum, payment) => sum + payment.amount,
        0
      ) || 0;
      
      const amountDue = orderTotal - amountPaid;

      return {
        "Order ID": order.id,
        Customer: order.customerName,
        "Due Date": new Date(order.dueDate).toISOString().split('T')[0],
        Status: order.status,
        "Order Total": orderTotal.toFixed(2),
        "Amount Paid": amountPaid.toFixed(2),
        "Amount Due": amountDue.toFixed(2),
        "Created At": new Date(order.createdAt).toISOString(),
      };
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
}

export const api = new ApiClient(API_URL);
