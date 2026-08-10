import { AuthResponse, CreateOrderInput, CreatePaymentInput, Order, UpdateOrderInput, ApiError, Payment } from "@/types";

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
      ...(options.headers as Record<string, string>),
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
}

export const api = new ApiClient(API_URL);