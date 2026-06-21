import { useState, useEffect } from 'react';
import { 
  ShoppingBag, LayoutDashboard, Package, Layers, ShoppingCart, Users, BadgeAlert, LogOut, ShieldAlert, Clock, UserCheck, Menu, X, CheckCircle, User as UserIcon
} from 'lucide-react';

import { 
  User, Category, Brand, Product, Customer, Order, Employee, SalaryPayment, Loan, LowStockAlertLog, AdvanceSalaryRequest 
} from './types';

import LoginScreen from './components/LoginScreen';
import DashboardView from './components/DashboardView';
import ProductsView from './components/ProductsView';
import CategoriesAndBrandsView from './components/CategoriesAndBrandsView';
import OrdersView from './components/OrdersView';
import CRMAndStaffView from './components/CRMAndStaffView';
import LowStockAlertLogsView from './components/LowStockAlertLogsView';
import MyProfileView from './components/MyProfileView';

export default function App() {
  const [activeUser, setActiveUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('inv_user_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeView, setActiveView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data States
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaries, setSalaries] = useState<SalaryPayment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [alerts, setAlerts] = useState<LowStockAlertLog[]>([]);
  const [advanceRequests, setAdvanceRequests] = useState<AdvanceSalaryRequest[]>([]);

  // Alert system notification toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync clocks
  const [systemTime, setSystemTime] = useState(new Date().toLocaleTimeString('en-US'));

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date().toLocaleTimeString('en-US'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync all server data
  const fetchAllData = async () => {
    if (!activeUser) return;
    try {
      const [
        dashboardRes,
        productsRes,
        categoriesRes,
        brandsRes,
        customersRes,
        ordersRes,
        employeesRes,
        salariesRes,
        loansRes,
        alertsRes,
        advanceRes
      ] = await Promise.all([
        fetch('/api/dashboard').then(res => res.json()),
        fetch('/api/products').then(res => res.json()),
        fetch('/api/categories').then(res => res.json()),
        fetch('/api/brands').then(res => res.json()),
        fetch('/api/customers').then(res => res.json()),
        fetch('/api/orders').then(res => res.json()),
        fetch('/api/employees').then(res => res.json()),
        fetch('/api/salaries').then(res => res.json()),
        fetch('/api/loans').then(res => res.json()),
        fetch('/api/alerts').then(res => res.json()),
        fetch('/api/advance-salary').then(res => res.json())
      ]);

      setDashboardData(dashboardRes);
      setProducts(productsRes);
      setCategories(categoriesRes);
      setBrands(brandsRes);
      setCustomers(customersRes);
      setOrders(ordersRes);
      setEmployees(employeesRes);
      setSalaries(salariesRes);
      setLoans(loansRes);
      setAlerts(alertsRes);
      setAdvanceRequests(advanceRes);
    } catch (err) {
      console.error('Error fetching data from server:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [activeUser]);

  // Auth logins handler
  const handleLogin = async (email: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }

    const data = await res.json();
    setActiveUser(data.user);
    localStorage.setItem('inv_user_session', JSON.stringify(data.user));
    setActiveView('dashboard');
  };

  const handleLogout = () => {
    setActiveUser(null);
    localStorage.removeItem('inv_user_session');
  };

  // --- CONTROLLER HANDLERS FOR SERVER ENDPOINTS ---
  const handleAddProduct = async (payload: Partial<Product>) => {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const newProd = await res.json();
    await fetchAllData();

    // Trigger toast check on creation
    if (newProd.quantity <= newProd.lowStockThreshold) {
      triggerLowStockToast(newProd.name, newProd.quantity);
    }
    return newProd;
  };

  const handleUpdateProduct = async (id: string, payload: Partial<Product>) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const updated = await res.json();
    await fetchAllData();

    if (updated.quantity <= updated.lowStockThreshold) {
      triggerLowStockToast(updated.name, updated.quantity);
    }
    return updated;
  };

  const handleDeleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await fetchAllData();
  };

  const handleAddCategory = async (payload: { name: string; description: string }) => {
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const newCat = await res.json();
    await fetchAllData();
    return newCat;
  };

  const handleAddBrand = async (payload: { name: string; description: string }) => {
    const res = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const newBrand = await res.json();
    await fetchAllData();
    return newBrand;
  };

  const handleAddCustomer = async (payload: { name: string; email: string; phone: string; address: string }) => {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const newCustomer = await res.json();
    await fetchAllData();
    return newCustomer;
  };

  // Creates order, decrs product quantities & triggers notifications if threshold matched
  const handleCreateOrder = async (payload: any) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const newOrder = await res.json();
    await fetchAllData();

    // Check low stock triggers on ordered items
    const currentProductsList = await fetch('/api/products').then(r => r.json());
    payload.items.forEach((orderedItem: any) => {
      const freshProd = currentProductsList.find((p: any) => p.id === orderedItem.productId);
      if (freshProd && freshProd.quantity <= freshProd.lowStockThreshold) {
        triggerLowStockToast(freshProd.name, freshProd.quantity);
      }
    });

    return newOrder;
  };

  const handleAddEmployee = async (payload: any) => {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const newEmp = await res.json();
    await fetchAllData();
    return newEmp;
  };

  const handleRecordSalary = async (payload: any) => {
    const res = await fetch('/api/salaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const payment = await res.json();
    await fetchAllData();
    return payment;
  };

  const handleRecordLoan = async (payload: any) => {
    const res = await fetch('/api/loans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const loanEntry = await res.json();
    await fetchAllData();
    return loanEntry;
  };

  const handleClearAlertsLog = async () => {
    const res = await fetch('/api/alerts', { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await fetchAllData();
  };

  const handleUpdateProfile = async (payload: { name: string; email: string; phone: string; bio?: string }) => {
    if (!activeUser) return;
    const res = await fetch(`/api/users/${activeUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const updatedUser = await res.json();
    setActiveUser(updatedUser);
    localStorage.setItem('inv_user_session', JSON.stringify(updatedUser));
    await fetchAllData();
    return updatedUser;
  };

  const handleRequestAdvance = async (payload: { amount: number; month: string; reason: string }) => {
    if (!activeUser) return;
    const res = await fetch('/api/advance-salary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        employeeId: activeUser.email
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const newRequest = await res.json();
    await fetchAllData();
    return newRequest;
  };

  const handleApproveRejectAdvance = async (id: string, status: 'approved' | 'rejected') => {
    const res = await fetch(`/api/advance-salary/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    const updatedObj = await res.json();
    await fetchAllData();
    return updatedObj;
  };

  // Toast System
  const triggerLowStockToast = (productName: string, remaining: number) => {
    setToastMessage(`⚠️ স্টক রিসিভারঃ "${productName}" কমে গিয়ে মাত্র ${remaining} পিস অবশিষ্ট আছে! স্বয়ংক্রিয় স্টক মেইল অ্যালার্ট পাঠানো হয়েছে।`);
    setTimeout(() => {
      setToastMessage(null);
    }, 8000);
  };

  if (!activeUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Sidebar Layout Navigation Link Configuration
  const navLinks = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'products', label: 'পণ্য স্টক CRUD', icon: Package },
    { id: 'categories', label: 'ক্যাটাগরি ও ব্র্যান্ড', icon: Layers },
    { id: 'orders', label: 'বিক্রয় ও ইনভয়েস', icon: ShoppingCart },
    { id: 'crm', label: 'কাস্টমার ও স্টাফ (HR)', icon: Users },
    { id: 'alerts', label: 'লো-স্টক মেইল ট্র্যাকার', icon: BadgeAlert, badge: alerts.length > 0 ? alerts.length : null },
    { id: 'profile', label: 'আমার প্রোফাইল ও এডভান্স', icon: UserIcon, badge: (activeUser.role === 'admin' && advanceRequests.filter(r => r.status === 'pending').length > 0) ? advanceRequests.filter(r => r.status === 'pending').length : null }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-700" id="app_view">
      {/* Toast Alert Popups */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-red-500 flex items-start gap-3 animate-in slide-in-from-bottom-5 duration-350">
          <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5 animate-bounce" />
          <div>
            <p className="text-xs font-bold leading-relaxed">{toastMessage}</p>
            <button 
              type="button" 
              onClick={() => setActiveView('alerts')}
              className="text-[10px] text-indigo-400 font-extrabold hover:underline mt-1 cursor-pointer"
            >
              মেইল লগ ও টেমপ্লেট রিভিউ করুন →
            </button>
          </div>
        </div>
      )}

      {/* Mobile Top Header */}
      <header className="md:hidden bg-slate-950 text-white p-4 flex justify-between items-center z-40 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xs tracking-tight uppercase">Smart Inventory</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1 text-slate-300 hover:text-white cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Side Navigation Bar */}
      <aside className={`w-64 max-w-[260px] bg-slate-950 text-slate-300 flex flex-col justify-between shrink-0 z-30 border-r border-slate-900 transition-all duration-300 md:translate-x-0 ${
        isMobileMenuOpen 
          ? 'fixed inset-y-0 left-0 translate-x-0' 
          : 'fixed md:sticky md:top-0 h-screen -translate-x-full'
      }`}>
        <div className="p-6 flex flex-col gap-6">
          {/* Logo Branding */}
          <div className="flex items-center gap-3 border-b border-slate-900 pb-5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-[13px] tracking-tight text-white block uppercase">INVENTORY SYSTEM</span>
              <span className="text-[10px] text-indigo-400 font-bold block mt-0.5">রোল-বেসড পোর্টাল</span>
            </div>
          </div>

          {/* Navigation Links list */}
          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const IconComp = link.icon;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => {
                    setActiveView(link.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                    activeView === link.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'hover:bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <IconComp className="w-4 h-4" />
                    {link.label}
                  </span>
                  {link.badge && (
                    <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Status Profile Card at Bottom of Aside */}
        <div className="p-5 border-t border-slate-900 bg-slate-950/50 space-y-3.5">
          <div className="flex gap-2.5 items-center">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-extrabold text-xs">
              {activeUser.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-white truncate max-w-[130px]">{activeUser.name}</p>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-0.5">{activeUser.role}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 bg-slate-900 group hover:bg-red-950/60 hover:text-red-400 text-slate-400 transition-all text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer border border-slate-800 hover:border-red-900/30"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500 group-hover:text-red-400" /> সেশন লগআউট করুন
          </button>
        </div>
      </aside>

      {/* Main Panel Content container */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar with server states */}
        <header className="bg-white border-b border-slate-100 p-4 px-6 justify-between items-center hidden md:flex shrink-0">
          <div className="flex items-center gap-6 text-[11px] font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> 
              সিস্টেম সময়ঃ <span className="font-mono font-bold text-slate-850">{systemTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
              লগ-ইনঃ <span className="font-bold text-slate-850">{activeUser.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Database STATUS: Connected
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          </div>
        </header>

        {/* View container switcher */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20">
          {dashboardData ? (
            <>
              {activeView === 'dashboard' && (
                <DashboardView 
                  data={dashboardData} 
                  activeUser={activeUser} 
                  onNavigate={(view) => setActiveView(view)} 
                  alerts={alerts}
                />
              )}
              {activeView === 'products' && (
                <ProductsView 
                  products={products} 
                  categories={categories} 
                  brands={brands} 
                  activeUser={activeUser}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                />
              )}
              {activeView === 'categories' && (
                <CategoriesAndBrandsView 
                  categories={categories} 
                  brands={brands} 
                  activeUser={activeUser}
                  onAddCategory={handleAddCategory}
                  onAddBrand={handleAddBrand}
                />
              )}
              {activeView === 'orders' && (
                <OrdersView 
                  orders={orders} 
                  products={products} 
                  customers={customers} 
                  activeUser={activeUser}
                  onCreateOrder={handleCreateOrder}
                />
              )}
              {activeView === 'crm' && (
                <CRMAndStaffView 
                  customers={customers} 
                  employees={employees} 
                  salaries={salaries} 
                  loans={loans} 
                  activeUser={activeUser}
                  onAddCustomer={handleAddCustomer}
                  onAddEmployee={handleAddEmployee}
                  onRecordSalary={handleRecordSalary}
                  onRecordLoan={handleRecordLoan}
                />
              )}
              {activeView === 'alerts' && (
                <LowStockAlertLogsView 
                  alerts={alerts} 
                  products={products}
                  activeUser={activeUser}
                  onClearAlertsLog={handleClearAlertsLog}
                />
              )}
              {activeView === 'profile' && (
                <MyProfileView 
                  activeUser={activeUser}
                  employees={employees}
                  salaries={salaries}
                  loans={loans}
                  advanceRequests={advanceRequests}
                  onUpdateProfile={handleUpdateProfile}
                  onRequestAdvance={handleRequestAdvance}
                  onApproveRejectAdvance={handleApproveRejectAdvance}
                />
              )}
            </>
          ) : (
            /* Elegant loading animation skeleton while fetching server metadata */
            <div className="flex flex-col items-center justify-center py-40 text-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-xs font-semibold">সিস্টেম ডাটা লোড করা হচ্ছে...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
