export interface User {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  categoryId: number;
  imageUrl: string | null;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: number;
  cartId: number;
  productId: number;
  quantity: number;
  product: Product;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: string;
  product: Product;
}

export interface Order {
  id: number;
  userId: number;
  totalAmount: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  items: OrderItem[];
  createdAt: string;
}

export interface OrderUserSummary {
  id: number;
  name: string;
  email: string;
}

export interface AdminOrder extends Order {
  user: OrderUserSummary;
}

export interface AuthResponse {
  user: User;
}

export interface PaginatedResponse<T> {
  products?: T[];
  orders?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}
