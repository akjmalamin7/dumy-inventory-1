import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  User, Category, Brand, Product, Customer, Order, Employee, SalaryPayment, Loan, LowStockAlertLog, AdvanceSalaryRequest, Supplier 
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

// Make sure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getFilePath(collectionName: string): string {
  return path.join(DATA_DIR, `${collectionName}.json`);
}

function readData<T>(collectionName: string, defaultData: T[]): T[] {
  const filePath = getFilePath(collectionName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T[];
  } catch (error) {
    console.error(`Error reading collection ${collectionName}, resetting to default:`, error);
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

function writeData<T>(collectionName: string, data: T[]): void {
  const filePath = getFilePath(collectionName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Initial/Seed Data
const DEFAULT_USERS: User[] = [
  { 
    id: 'u0', 
    name: 'Super Admin', 
    email: 'superadmin@inventory.com', 
    role: 'supper_admin', 
    status: 'active', 
    phone: '+8801700000000',
    designation: 'চিফ এক্সিকিউটিভ (Super Admin)',
    address: 'গুলশান, ঢাকা',
    nid: '1234567890',
    bloodGroup: 'A+',
    bio: 'আমি এই সিস্টেমের সুপার অ্যাডমিন কর্মকর্তা। আমি সব কার্যক্রম ও অনুমতি নিয়ন্ত্রণ করতে পারি।',
    joinedDate: '2023-01-01',
    employeeId: 'EMP-SA-001',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    birthDate: '1990-01-01',
    allowedMenus: ['dashboard', 'products', 'categories', 'orders', 'crm', 'reports', 'alerts', 'profile']
  },
  { 
    id: 'u1', 
    name: 'Admin User', 
    email: 'admin@inventory.com', 
    role: 'admin', 
    status: 'active', 
    phone: '+8801700000001',
    designation: 'কোম্পানি প্রধান ও এডমিনিস্ট্রেটর',
    address: 'বাড়ি ৮, রোড ৫, গুলশান-২, ঢাকা',
    nid: '9812476531',
    bloodGroup: 'B+',
    bio: 'আমি এই কোম্পানির প্রধান ইনভেন্টরি ও সেলস এডমিন হিসেবে নিয়োজিত আছি। সিস্টেমের সকল অপারেশন ও ব্যাকআপ মনিটর করছি।',
    joinedDate: '2024-01-01',
    employeeId: 'EMP-2024-001',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    birthDate: '1992-06-22',
    allowedMenus: ['dashboard', 'products', 'categories', 'orders', 'crm', 'reports', 'alerts', 'profile']
  },
  { 
    id: 'u2', 
    name: 'Employee Staff', 
    email: 'employee@inventory.com', 
    role: 'employee', 
    status: 'active', 
    phone: '+8801700000002',
    designation: 'জিনিয়র সেলস এক্সিকিউটিভ',
    address: 'সেক্টর ৪, উত্তরা, ঢাকা',
    nid: '4876251439',
    bloodGroup: 'O+',
    bio: 'আমি ইনভেন্টরি পণ্য স্টক হ্যান্ডেল এবং খদ্দেরদের কাছে খুচরা বিক্রয় ও অর্ডার ক্যাশ রশিদ জেনারেট করি।',
    joinedDate: '2025-02-15',
    employeeId: 'EMP-2025-042',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    birthDate: '1998-06-21', // Today (June 21) is employee's birthday!
    allowedMenus: ['dashboard', 'orders', 'profile'] // Default restricted menu permissions for employee
  }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Electronics', description: 'Gadgets, phones, and computers', createdAt: '2026-05-15T10:00:00Z' },
  { id: 'c2', name: 'Home Appliances', description: 'Kitchen and home electrical goods', createdAt: '2026-05-16T11:00:00Z' },
  { id: 'c3', name: 'Office Supplies', description: 'Stationery and office tools', createdAt: '2026-05-17T12:00:00Z' }
];

const DEFAULT_BRANDS: Brand[] = [
  { id: 'b1', name: 'Apple', description: 'Premium smartphones and laptops', createdAt: '2026-05-15T10:00:00Z' },
  { id: 'b2', name: 'Samsung', description: 'Global tech products range', createdAt: '2026-05-15T10:30:00Z' },
  { id: 'b3', name: 'Sony', description: 'Premium audio and visual devices', createdAt: '2026-05-16T09:00:00Z' },
  { id: 'b4', name: 'Logitech', description: 'Premium peripheral manufacturer', createdAt: '2026-05-17T14:00:00Z' }
];

const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'মোঃ করিম রহমান', companyName: 'রহমান টেক ডিস্ট্রিবিউটরস', phone: '+8801722222222', email: 'rahman.tech@gmail.com', address: 'মতিঝিল, ঢাকা', createdAt: '2026-05-10T10:00:00Z' },
  { id: 's2', name: 'আসিফ আল হোসাইন', companyName: 'গ্যাজেট ও ওয়ার্ল্ড বিডি', phone: '+8801833333333', email: 'asif.gadgets@bd.co', address: 'IDB ভবন, ঢাকা', createdAt: '2026-05-11T12:00:00Z' }
];

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'p1', name: 'iPhone 15 Pro Max', sku: 'IPH15PM-256', categoryId: 'c1', brandId: 'b1', price: 154000, cost: 132000, quantity: 4, lowStockThreshold: 10, description: 'Apple iPhone 15 Pro Max 256GB Natural Titanium.', createdAt: '2026-05-20T10:00:00Z', supplierId: 's1' },
  { id: 'p2', name: 'Samsung Galaxy S24 Ultra', sku: 'SAMS24U-512', categoryId: 'c1', brandId: 'b2', price: 145000, cost: 125000, quantity: 12, lowStockThreshold: 8, description: 'Samsung Galaxy S24 Ultra 512GB Titanium Gray with S-Pen.', createdAt: '2026-05-21T11:00:00Z', supplierId: 's1' },
  { id: 'p3', name: 'Sony WH-1000XM5', sku: 'SONY-XM5-W', categoryId: 'c1', brandId: 'b3', price: 42000, cost: 35000, quantity: 2, lowStockThreshold: 5, description: 'Industry leading noise canceling headphones, Silver.', createdAt: '2026-05-22T09:00:00Z', supplierId: 's2' },
  { id: 'p4', name: 'Logitech MX Master 3S', sku: 'LOGI-MX3S', categoryId: 'c3', brandId: 'b4', price: 12500, cost: 9800, quantity: 25, lowStockThreshold: 6, description: 'Performance wireless mouse with silent clicks.', createdAt: '2026-05-23T14:45:00Z', supplierId: 's2' },
  { id: 'p5', name: 'Smart Microwave Oven', sku: 'MW-SMART-20', categoryId: 'c2', brandId: 'b2', price: 28500, cost: 21000, quantity: 15, lowStockThreshold: 4, description: 'Sleek smart microwave oven with WiFi connectivity.', createdAt: '2026-05-24T12:00:00Z', supplierId: 's1' }
];

const DEFAULT_CUSTOMERS: Customer[] = [
  { id: 'cs1', name: 'Al-Amin Rahman', email: 'alamin.soppiya@gmail.com', phone: '+8801712345678', address: 'Mirpur, Dhaka, Bangladesh', createdAt: '2026-06-01T10:00:00Z' },
  { id: 'cs2', name: 'Tariq Habib', email: 'tariq.h@live.com', phone: '+8801812345678', address: 'Gulshan-2, Dhaka', createdAt: '2026-06-02T12:00:00Z' },
  { id: 'cs3', name: 'Sumona Jahan', email: 'sumona@yahoo.com', phone: '+8801512345678', address: 'Agrabad, Chattogram', createdAt: '2026-06-03T15:30:00Z' }
];

const DEFAULT_ORDERS: Order[] = [
  {
    id: 'o1',
    invoiceNumber: 'INV-2026-0001',
    customerId: 'cs1',
    customerName: 'Al-Amin Rahman',
    items: [
      { productId: 'p1', name: 'iPhone 15 Pro Max', quantity: 1, price: 154000 },
      { productId: 'p4', name: 'Logitech MX Master 3S', quantity: 2, price: 12500 }
    ],
    subtotal: 179000,
    discount: 5000,
    totalAmount: 174000,
    paymentStatus: 'Paid',
    createdAt: '2026-06-19T11:00:00Z',
    createdBy: 'u2'
  },
  {
    id: 'o2',
    invoiceNumber: 'INV-2026-0002',
    customerId: 'cs2',
    customerName: 'Tariq Habib',
    items: [
      { productId: 'p2', name: 'Samsung Galaxy S24 Ultra', quantity: 1, price: 145000 }
    ],
    subtotal: 145000,
    discount: 0,
    totalAmount: 145000,
    paymentStatus: 'Partial',
    createdAt: '2026-06-20T14:30:00Z',
    createdBy: 'u2'
  }
];

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'emp1', name: 'Rahim Khan', email: 'rahim@company.com', phone: '+8801912345111', designation: 'Sales Manager', joinedDate: '2025-01-10', salaryAmount: 35000, status: 'active' },
  { id: 'emp2', name: 'Nusrat Chowdhury', email: 'nusrat@company.com', phone: '+8801912345222', designation: 'Stock Auditor', joinedDate: '2025-05-15', salaryAmount: 28000, status: 'active' },
  { id: 'emp3', name: 'Kamal Pasha', email: 'kamal@company.com', phone: '+8801912345333', designation: 'Delivery Staff', joinedDate: '2025-11-20', salaryAmount: 20000, status: 'active' }
];

const DEFAULT_SALARIES: SalaryPayment[] = [
  { id: 'sal1', employeeId: 'emp1', employeeName: 'Rahim Khan', month: 'May 2026', amount: 35000, paymentDate: '2026-06-03T09:00:00Z', status: 'paid' },
  { id: 'sal2', employeeId: 'emp2', employeeName: 'Nusrat Chowdhury', month: 'May 2026', amount: 28000, paymentDate: '2026-06-03T09:30:00Z', status: 'paid' },
  { id: 'sal3', employeeId: 'emp3', employeeName: 'Kamal Pasha', month: 'May 2026', amount: 20000, paymentDate: '2026-06-05T11:00:00Z', status: 'paid' }
];

const DEFAULT_LOANS: Loan[] = [
  { id: 'l1', employeeId: 'emp1', employeeName: 'Rahim Khan', amount: 15000, type: 'disbursed', date: '2026-06-04', description: 'Emergency medical loan' },
  { id: 'l2', employeeId: 'emp1', employeeName: 'Rahim Khan', amount: 5000, type: 'repaid', date: '2026-06-15', description: 'First installment repaid from mid-month bonus' }
];

const DEFAULT_ALERTS: LowStockAlertLog[] = [
  {
    id: 'alt1',
    productId: 'p1',
    productName: 'iPhone 15 Pro Max',
    currentQuantity: 4,
    threshold: 10,
    sentTo: 'admin@inventory.com',
    sentAt: '2026-06-20T10:05:00Z',
    status: 'sent'
  },
  {
    id: 'alt2',
    productId: 'p3',
    productName: 'Sony WH-1000XM5',
    currentQuantity: 2,
    threshold: 5,
    sentTo: 'admin@inventory.com',
    sentAt: '2026-06-20T11:45:00Z',
    status: 'sent'
  }
];

const DEFAULT_ADVANCE_SALARIES: AdvanceSalaryRequest[] = [
  {
    id: 'adv1',
    employeeId: 'emp2',
    employeeName: 'Nusrat Chowdhury',
    amount: 10000,
    month: 'July 2026',
    reason: 'পারিবারিক চিকিৎসা খরচ নির্বাহ করার জন্য অগ্রিম বেতন',
    requestDate: '2026-06-20',
    status: 'pending'
  }
];

// DB Controllers
export const dbStore = {
  getUsers: () => {
    const users = readData<User>('users', DEFAULT_USERS);
    if (!users.some(u => u.role === 'supper_admin' || u.email.toLowerCase() === 'superadmin@inventory.com')) {
      const sa = DEFAULT_USERS[0];
      users.unshift(sa);
      writeData<User>('users', users);
    }
    return users;
  },
  saveUsers: (data: User[]) => writeData<User>('users', data),

  getCategories: () => readData<Category>('categories', DEFAULT_CATEGORIES),
  saveCategories: (data: Category[]) => writeData<Category>('categories', data),

  getBrands: () => readData<Brand>('brands', DEFAULT_BRANDS),
  saveBrands: (data: Brand[]) => writeData<Brand>('brands', data),

  getProducts: () => readData<Product>('products', DEFAULT_PRODUCTS),
  saveProducts: (data: Product[]) => writeData<Product>('products', data),

  getCustomers: () => readData<Customer>('customers', DEFAULT_CUSTOMERS),
  saveCustomers: (data: Customer[]) => writeData<Customer>('customers', data),

  getOrders: () => readData<Order>('orders', DEFAULT_ORDERS),
  saveOrders: (data: Order[]) => writeData<Order>('orders', data),

  getEmployees: () => readData<Employee>('employees', DEFAULT_EMPLOYEES),
  saveEmployees: (data: Employee[]) => writeData<Employee>('employees', data),

  getSalaries: () => readData<SalaryPayment>('salaries', DEFAULT_SALARIES),
  saveSalaries: (data: SalaryPayment[]) => writeData<SalaryPayment>('salaries', data),

  getLoans: () => readData<Loan>('loans', DEFAULT_LOANS),
  saveLoans: (data: Loan[]) => writeData<Loan>('loans', data),

  getAlerts: () => readData<LowStockAlertLog>('alerts', DEFAULT_ALERTS),
  saveAlerts: (data: LowStockAlertLog[]) => writeData<LowStockAlertLog>('alerts', data),

  getAdvanceSalaries: () => readData<AdvanceSalaryRequest>('advance_salaries', DEFAULT_ADVANCE_SALARIES),
  saveAdvanceSalaries: (data: AdvanceSalaryRequest[]) => writeData<AdvanceSalaryRequest>('advance_salaries', data),

  getSuppliers: () => readData<Supplier>('suppliers', DEFAULT_SUPPLIERS),
  saveSuppliers: (data: Supplier[]) => writeData<Supplier>('suppliers', data)
};

export function checkLowStockAndTriggerAlert(productId: string, productName: string, newQty: number, threshold: number): LowStockAlertLog | null {
  if (newQty <= threshold) {
    const alerts = dbStore.getAlerts();
    // Avoid double alerting for the same stock count within the same few minutes if desired, but here we alert every transition below threshold.
    const alertId = 'alt_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const newAlert: LowStockAlertLog = {
      id: alertId,
      productId,
      productName,
      currentQuantity: newQty,
      threshold,
      sentTo: 'admin@inventory.com',
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    alerts.unshift(newAlert);
    dbStore.saveAlerts(alerts);
    return newAlert;
  }
  return null;
}

