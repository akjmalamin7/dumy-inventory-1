import React from 'react';
import { 
  TrendingUp, Package, Users, BadgeAlert, Coins, CircleDollarSign, Plus, Eye, ArrowRight, ShieldAlert 
} from 'lucide-react';
import { User, LowStockAlertLog } from '../types.js';

interface DashboardStats {
  totalProducts: number;
  totalStockQty: number;
  stockNetWorth: number;
  stockSellingValue: number;
  totalSalesValue: number;
  profit: number;
  activeStaffLoanBalance: number;
  lowStockCount: number;
  employeeCount: number;
}

interface DashboardData {
  summary: DashboardStats;
  lowStockItems: any[];
  categoryDistribution: { name: string; count: number }[];
  salesTimeline: { date: string; amount: number; profit: number }[];
  recentOrders: any[];
}

interface DashboardViewProps {
  data: DashboardData;
  activeUser: User;
  onNavigate: (view: string) => void;
  alerts: LowStockAlertLog[];
}

export default function DashboardView({ data, activeUser, onNavigate, alerts }: DashboardViewProps) {
  const { summary, lowStockItems, categoryDistribution, salesTimeline, recentOrders } = data;
  const isAdmin = activeUser.role === 'admin';

  // Format money helper (BDT/Taka formatted)
  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-IN')}`;
  };

  // Find max sales amount to scale custom SVG chart safely
  const maxSalesAmount = Math.max(...salesTimeline.map(s => s.amount), 1);

  return (
    <div className="space-y-6" id="dashboard_view">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">স্বাগতম, {activeUser.name}! 👋</h1>
          <p className="text-slate-300 text-sm mt-1">
            আপনার প্রতিষ্ঠানের আজকের রিয়েল-টাইম ইনভেন্টরি ও সেলস রিপোর্ট।
          </p>
          <div className="mt-3 flex gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              রোল: {activeUser.role === 'admin' ? 'এডমিন (Admin)' : 'স্টাফ কর্মচারী (Employee)'}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              অ্যাক্টিভ সেশন
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={() => onNavigate('orders')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition text-white text-xs font-medium rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> নতুন সেলস অর্ডার
          </button>
          <button 
            type="button" 
            onClick={() => onNavigate('products')}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 transition text-white text-xs font-medium rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <Package className="w-4 h-4" /> পণ্য যোগ করুন
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">সর্বমোট বিক্রি (Total Sales)</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{formatCurrency(summary.totalSalesValue)}</p>
          </div>
        </div>

        {/* Card 2: Net Profit (Admin only check) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-pink-50 text-pink-600 rounded-xl">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">নিট মুনাফা (Net Profit)</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">
              {isAdmin ? formatCurrency(summary.profit) : '🔒 শুধুমাত্র এডমিন'}
            </p>
          </div>
        </div>

        {/* Card 3: Stock asset values */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">স্টক ক্রয়মূল্য (Asset Value)</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">
              {isAdmin ? formatCurrency(summary.stockNetWorth) : formatCurrency(summary.stockSellingValue)}
            </p>
          </div>
        </div>

        {/* Card 4: Low stock trigger */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-xl ${summary.lowStockCount > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-50 text-slate-500'}`}>
            <BadgeAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">স্টক সতর্কবার্তা (Low Stock)</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
              {summary.lowStockCount} টি পণ্য
              {summary.lowStockCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping"></span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart Container */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-md font-bold text-slate-800">সেলস ট্রেন্ড ও রেভিনিউ ট্র্যাকার</h3>
              <p className="text-xs text-slate-500">চলতি সপ্তাহের বিক্রির গতিবিধি গ্রাফ</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-3 h-3 bg-indigo-500 rounded-full"></span> বিক্রয় (Sales)
              </span>
              {isAdmin && (
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full"></span> লভ্যাংশ (Profit)
                </span>
              )}
            </div>
          </div>

          {/* High-Fidelity Custom SVG/HTML Chart */}
          <div className="relative h-64 w-full flex flex-col justify-end">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-b border-dashed border-slate-100 h-0"></div>
              <div className="border-b border-dashed border-slate-100 h-0"></div>
              <div className="border-b border-dashed border-slate-100 h-0"></div>
              <div className="border-b border-dashed border-slate-100 h-0"></div>
            </div>

            <div className="flex items-end justify-between h-48 px-4 z-10 relative">
              {salesTimeline.map((item, index) => {
                const salesHeight = (item.amount / maxSalesAmount) * 100;
                const profitHeight = (item.profit / maxSalesAmount) * 100;
                return (
                  <div key={index} className="flex flex-col items-center group relative w-1/12">
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 whitespace-nowrap shadow-md">
                      <div>বিক্রি: {formatCurrency(item.amount)}</div>
                      {isAdmin && <div className="text-emerald-300">লাভ: {formatCurrency(item.profit)}</div>}
                    </div>

                    <div className="flex items-end gap-1 w-full justify-center h-44">
                      {/* Sales Bar */}
                      <div 
                        className="w-4 bg-indigo-500 hover:bg-indigo-600 rounded-t transition-all duration-500"
                        style={{ height: `${Math.max(salesHeight, 8)}%` }}
                      ></div>
                      {/* Profit Bar - Admin Only */}
                      {isAdmin && (
                        <div 
                          className="w-4 bg-emerald-400 hover:bg-emerald-500 rounded-t transition-all duration-500"
                          style={{ height: `${Math.max(profitHeight, 4)}%` }}
                        ></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between border-t border-slate-100 pt-2 mt-2 px-2 text-[11px] font-medium text-slate-500">
              {salesTimeline.map((item, idx) => (
                <span key={idx} className="w-1/12 text-center">{item.date}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Category Share & Loan Stats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-md font-bold text-slate-800">ক্যাটাগরিভিত্তিক স্টক বিন্যাস</h3>
            <p className="text-xs text-slate-500 mb-4">পণ্য সংখ্যা এবং ক্যাটাগরি তালিকা</p>

            <div className="space-y-3.5 mt-2">
              {categoryDistribution.map((cat, idx) => {
                const progressWidth = Math.min((cat.count / Math.max(summary.totalProducts, 1)) * 100, 100);
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-xs text-slate-700 font-medium mb-1">
                      <span>{cat.name}</span>
                      <span>{cat.count} টি পণ্য</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${progressWidth}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {categoryDistribution.length === 0 && (
                <p className="text-slate-400 text-xs text-center py-4">কোনো ক্যাটাগরি ডাটা নেই।</p>
              )}
            </div>
          </div>

          {/* Employee Loan Summary Box */}
          <div className="mt-6 pt-6 border-t border-slate-100 bg-slate-50 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" /> কর্মচারী ঋণ পরিস্থিতি (Staff Loans)
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">মজুদ ঋণ ব্যালেন্স বর্তমানে বকেয়া</p>
              </div>
              <p className="text-md font-bold text-slate-800">
                {formatCurrency(summary.activeStaffLoanBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert logs and Recent Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Email Alerts Logs */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-1 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-md font-bold text-slate-805 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-500" /> ইমেইল নোটিফিকেশন লগ
              </h3>
              <p className="text-xs text-slate-500">স্বয়ংক্রিয় স্টক অ্যালার্ট নোটিশ</p>
            </div>
            <button 
              type="button" 
              onClick={() => onNavigate('alerts')}
              className="text-xs text-indigo-600 hover:text-indigo-805 font-medium flex items-center gap-1 cursor-pointer"
            >
              সব দেখুন <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[300px] flex-1">
            {alerts.slice(0, 4).map((alert) => (
              <div key={alert.id} className="p-3 bg-red-50/50 rounded-xl border border-red-100 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5 animate-ping"></div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{alert.productName} সতর্কীকরণ!</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">মজুদ মাত্র <b>{alert.currentQuantity}</b> পিস (থ্রেশহোল্ড: {alert.threshold})</p>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    📬 Alert sent to: {alert.sentTo}
                  </span>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-10">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-400 text-xs">সব মজুদ পর্যাপ্ত আছে। কোনো স্টক অ্যালার্ট নেই!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-md font-bold text-slate-800">সাম্প্রতিক বিক্রি সমূহ (Recent Orders)</h3>
              <p className="text-xs text-slate-500">শেষ ৫টি সেলস অর্ডারের রেকর্ড</p>
            </div>
            <button 
              type="button" 
              onClick={() => onNavigate('orders')}
              className="text-xs text-indigo-600 hover:text-indigo-805 font-medium flex items-center gap-1 cursor-pointer"
            >
              সব রশীদ <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="text-slate-700 bg-slate-50 rounded-lg">
                <tr>
                  <th className="p-3">ইনভয়েস</th>
                  <th className="p-3">ক্রেতা</th>
                  <th className="p-3">তারিখ</th>
                  <th className="p-3">মোট মূল্য</th>
                  <th className="p-3">অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-800">{order.invoiceNumber}</td>
                    <td className="p-3 font-medium text-slate-700">{order.customerName}</td>
                    <td className="p-3 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="p-3 font-bold text-slate-800">{formatCurrency(order.totalAmount)}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        order.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {order.paymentStatus === 'Paid' ? 'পরিশোধিত' :
                         order.paymentStatus === 'Partial' ? 'আংশিক' : 'অপরিশোধিত'}
                      </span>
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">কোনো সেলস অর্ডার পাওয়া যায়নি।</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
