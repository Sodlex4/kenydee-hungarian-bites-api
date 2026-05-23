export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
  amount: number;
  date: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  method?: 'M-Pesa' | 'Cash';
  deliveryAddress: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
  joined: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  type: 'order' | 'info' | 'alert';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface AdminSettings {
  siteName: string;
  siteDescription: string;
  whatsapp: string;
  email: string;
  currency: string;
  deliveryFee: number;
  freeDeliveryMin: number;
  deliveryTime: string;
  deliveryRadius: string;
}

export interface AdminPreferences {
  notifications: boolean;
  emailAlerts: boolean;
  orderUpdates: boolean;
  marketingEmails: boolean;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  pendingOrders: number;
  revenueData: { date: string; revenue: number }[];
  orderStatusData: { status: string; count: number }[];
}

export interface AuthPayload {
  userId: string;
  role: 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
