// Central API base URL for the ASP.NET backend
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5160";

export interface PlaceOrderPayload {
  customerId?: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  zip: string;
  paymentMethod: string;
  paymentIntentId?: string;   // Stripe payment intent ID (for card payments)
  items: { productId: number; quantity: number }[];
}

export interface OrderResponse {
  success: boolean;
  orderId: number;
  orderNumber: string;
  total: number;
}

export interface TrackingResponse {
  orderNumber: string;
  status: string;
  shipToName: string;
  shipToCity: string;
  courierName?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  total: number;
  items: { name: string; quantity: number; price: number }[];
  timeline: { status: string; description: string; timestamp: string }[];
}

// Place an order via the backend API
export async function placeOrder(payload: PlaceOrderPayload): Promise<OrderResponse> {
  const res = await fetch(`${API_BASE}/api/ordersapi`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Failed to place order");
  }
  return res.json();
}

// Track an order by order number
export async function trackOrder(orderNumber: string): Promise<TrackingResponse | null> {
  const res = await fetch(`${API_BASE}/api/ordersapi/${orderNumber}`, {
    credentials: "include",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch order");
  return res.json();
}

// Fetch live product catalog
export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/api/products`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

// ── Customer Auth ──────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export async function apiLogin(
  email: string,
  password: string,
  recaptchaToken?: string
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, recaptchaToken }),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  return data as AuthUser;
}

export async function apiRegister(
  name: string,
  email: string,
  password: string,
  phone: string,
  recaptchaToken?: string
): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, phone, recaptchaToken }),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  return data as AuthUser;
}

export async function apiLogout(userId: string, email: string): Promise<void> {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, email }),
    credentials: "include",
  });
}

// Fetch orders for a specific customer
export async function fetchMyOrders(customerId: string) {
  const res = await fetch(`${API_BASE}/api/orders/my/${customerId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

// Create a Stripe PaymentIntent on the backend
export async function createPaymentIntent(
  amountPhp: number,
  customerName?: string,
  orderRef?: string
): Promise<{ clientSecret: string }> {
  const res = await fetch(`${API_BASE}/api/stripe/create-payment-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amountPhp, customerName, orderRef }),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to initialize payment");
  return data;
}

// Fetch return requests for a specific customer
export async function fetchMyReturns(customerId: string) {
  const res = await fetch(`${API_BASE}/api/returns/my/${customerId}`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch returns");
  return res.json();
}

// ── Order Detail (authenticated customer) ──────────────────────

export interface OrderDetailItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderDetailTracking {
  status: string;
  description: string;
  timestamp: string;
  location?: string;
}

export interface OrderDetail {
  id: number;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  paymentMethod: string;
  courierName?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  canConfirmDelivery: boolean;
  canRequestReturn: boolean;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    province: string;
    zip: string;
    phone: string;
  };
  items: OrderDetailItem[];
  trackingEvents: OrderDetailTracking[];
}

// Fetch full detail for a single order belonging to this customer
export async function fetchOrderDetail(
  customerId: string,
  orderNumber: string
): Promise<OrderDetail | null> {
  const res = await fetch(
    `${API_BASE}/api/orders/my/${customerId}/detail/${orderNumber}`,
    { credentials: "include" }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch order detail");
  return res.json();
}

// Submit a return request from the storefront
export async function submitReturn(payload: {
  customerId: string;
  orderNumber: string;
  reason: string;
  description?: string;
}): Promise<{ success: boolean; returnId: number }> {
  const res = await fetch(`${API_BASE}/api/returns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to submit return request");
  return data;
}

// Confirm delivery from the storefront
export async function confirmDelivery(
  customerId: string,
  orderNumber: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/orders/my/${customerId}/confirm-delivery/${orderNumber}`,
    { method: "POST", credentials: "include" }
  );
  if (!res.ok) throw new Error("Failed to confirm delivery");
}
