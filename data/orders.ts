export type OrderStatus =
  | "Pending"
  | "Validated"
  | "Picking"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Return Requested"
  | "Return Approved";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface TrackingEvent {
  status: OrderStatus;
  timestamp: string;
  description: string;
  location?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    province: string;
    zip: string;
    phone: string;
  };
  courier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  trackingEvents: TrackingEvent[];
  canConfirmDelivery: boolean;
  canRequestReturn: boolean;
}

export const mockOrders: Order[] = [
  {
    id: "ord001",
    orderNumber: "NXR-2024-001",
    date: "2024-04-18",
    status: "Delivered",
    items: [
      { productId: "p006", name: "Sony WH-1000XM5 Headphones", price: 18990, quantity: 1, image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=200&q=80" },
      { productId: "p004", name: "USB-C to USB-C Braided Cable 2m", price: 549, quantity: 2, image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&q=80" },
    ],
    subtotal: 20088,
    shipping: 150,
    total: 20238,
    shippingAddress: { name: "Maria Santos", address: "123 Rizal Street", city: "Makati", province: "Metro Manila", zip: "1200", phone: "+63 917 123 4567" },
    courier: "J&T Express",
    trackingNumber: "JT0123456789PH",
    estimatedDelivery: "2024-04-22",
    trackingEvents: [
      { status: "Pending", timestamp: "2024-04-18T08:00:00", description: "Order placed successfully." },
      { status: "Validated", timestamp: "2024-04-18T09:30:00", description: "Order validated by warehouse manager." },
      { status: "Picking", timestamp: "2024-04-18T11:00:00", description: "Warehouse staff is picking your items.", location: "Nexora Warehouse, Pasig City" },
      { status: "Packed", timestamp: "2024-04-18T14:00:00", description: "Order packed and ready for pickup.", location: "Nexora Warehouse, Pasig City" },
      { status: "Shipped", timestamp: "2024-04-19T08:00:00", description: "Order picked up by J&T Express.", location: "Pasig City Hub" },
      { status: "Delivered", timestamp: "2024-04-22T13:45:00", description: "Package delivered to recipient.", location: "Makati City" },
    ],
    canConfirmDelivery: true,
    canRequestReturn: true,
  },
  {
    id: "ord002",
    orderNumber: "NXR-2024-002",
    date: "2024-04-20",
    status: "Shipped",
    items: [
      { productId: "p003", name: "Apple iPhone 15 Pro", price: 64990, quantity: 1, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200&q=80" },
      { productId: "p009", name: "Apple MagSafe Leather Case", price: 2990, quantity: 1, image: "https://images.unsplash.com/photo-1592439676045-a6a1dcf8b3d5?w=200&q=80" },
    ],
    subtotal: 67980,
    shipping: 0,
    total: 67980,
    shippingAddress: { name: "Maria Santos", address: "123 Rizal Street", city: "Makati", province: "Metro Manila", zip: "1200", phone: "+63 917 123 4567" },
    courier: "LBC Express",
    trackingNumber: "LBC9876543210",
    estimatedDelivery: "2024-04-23",
    trackingEvents: [
      { status: "Pending", timestamp: "2024-04-20T10:00:00", description: "Order placed successfully." },
      { status: "Validated", timestamp: "2024-04-20T11:00:00", description: "Order validated by warehouse manager." },
      { status: "Picking", timestamp: "2024-04-20T13:00:00", description: "Warehouse staff is picking your items.", location: "Nexora Warehouse, Pasig City" },
      { status: "Packed", timestamp: "2024-04-20T15:30:00", description: "Order packed and ready for pickup.", location: "Nexora Warehouse, Pasig City" },
      { status: "Shipped", timestamp: "2024-04-21T07:00:00", description: "Order picked up by LBC Express.", location: "Pasig City Hub" },
    ],
    canConfirmDelivery: false,
    canRequestReturn: false,
  },
  {
    id: "ord003",
    orderNumber: "NXR-2024-003",
    date: "2024-04-22",
    status: "Picking",
    items: [
      { productId: "p005", name: "GaN 65W Compact Charger", price: 1299, quantity: 2, image: "https://images.unsplash.com/photo-1601524909162-ae8725290836?w=200&q=80" },
      { productId: "p010", name: "Anker USB-C Hub 7-in-1", price: 1999, quantity: 1, image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=200&q=80" },
    ],
    subtotal: 4597,
    shipping: 150,
    total: 4747,
    shippingAddress: { name: "Maria Santos", address: "123 Rizal Street", city: "Makati", province: "Metro Manila", zip: "1200", phone: "+63 917 123 4567" },
    trackingEvents: [
      { status: "Pending", timestamp: "2024-04-22T09:00:00", description: "Order placed successfully." },
      { status: "Validated", timestamp: "2024-04-22T09:45:00", description: "Order validated by warehouse manager." },
      { status: "Picking", timestamp: "2024-04-22T11:00:00", description: "Warehouse staff is picking your items.", location: "Nexora Warehouse, Pasig City" },
    ],
    canConfirmDelivery: false,
    canRequestReturn: false,
  },
];

export const statusSteps: OrderStatus[] = [
  "Pending",
  "Validated",
  "Picking",
  "Packed",
  "Shipped",
  "Delivered",
];
