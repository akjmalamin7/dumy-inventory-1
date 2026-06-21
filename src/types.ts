export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  joinedDate?: string;
  phone?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  categoryId: string;
  brandId: string;
  price: number;
  cost: number;
  quantity: number;
  lowStockThreshold: number;
  description: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
  createdAt: string;
  createdBy: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  joinedDate: string;
  salaryAmount: number;
  status: 'active' | 'inactive';
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string; // e.g., "June 2026"
  amount: number;
  paymentDate: string;
  status: 'paid' | 'pending';
}

export interface Loan {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  type: 'disbursed' | 'repaid';
  date: string;
  description: string;
}

export interface LowStockAlertLog {
  id: string;
  productId: string;
  productName: string;
  currentQuantity: number;
  threshold: number;
  sentTo: string;
  sentAt: string;
  status: 'sent' | 'failed';
}

export interface AdvanceSalaryRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  month: string;
  reason: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
  actionDate?: string;
}

