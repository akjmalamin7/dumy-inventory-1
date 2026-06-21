import React, { useState } from 'react';
import { 
  TrendingUp, Calendar, Users, Search, ShoppingBag, Coins, 
  CheckCircle, Layers, Eye, FileDown, ArrowRight, UserCheck, 
  BarChart3, Clock, LayoutDashboard
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Order, Product, Customer, User, Employee } from '../types.js';

interface ReportsViewProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  users: User[];
  employees: Employee[];
  activeUser: User;
}

type PeriodType = 'daily' | 'weekly' | 'monthly' | '6monthly' | 'yearly';

export default function ReportsView({
  orders, products, customers, users, employees, activeUser
}: ReportsViewProps) {
  const isAdmin = activeUser.role === 'admin';
  const [activeTab, setActiveTab] = useState<'period_reports' | 'employee_performance'>('period_reports');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('monthly');
  const [empSearch, setEmpSearch] = useState('');
  const [selectedEmployeeOrders, setSelectedEmployeeOrders] = useState<User | null>(null);

  // Currency utility helper
  const formatCurrency = (val: number) => {
    return `৳${val.toLocaleString('en-IN')}`;
  };

  // 1. FILTER ORDERS DYNAMICALLY BY PERIOD
  const filterOrdersByPeriodRange = (ordersList: Order[], period: PeriodType) => {
    const reference = new Date();
    return ordersList.filter(o => {
      const orderDate = new Date(o.createdAt);
      const diffTime = Math.abs(reference.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (period) {
        case 'daily':
          // Today calendar day or <= 1 day
          return orderDate.toDateString() === reference.toDateString() || diffDays <= 1;
        case 'weekly':
          return diffDays <= 7;
        case 'monthly':
          return diffDays <= 30;
        case '6monthly':
          return diffDays <= 180;
        case 'yearly':
          return diffDays <= 365;
        default:
          return true;
      }
    });
  };

  const periodFilteredOrders = filterOrdersByPeriodRange(orders, selectedPeriod);

  // Compute stats for selected period
  const totalSalesVal = periodFilteredOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalOrdersCount = periodFilteredOrders.length;
  const totalItemsCount = periodFilteredOrders.reduce(
    (s, o) => s + o.items.reduce((sum, item) => sum + item.quantity, 0), 0
  );

  // Compute exact cost of goods sold & profit
  const totalCostOfSoldGoods = periodFilteredOrders.reduce((sum, o) => {
    return sum + o.items.reduce((innerSum, item) => {
      const prod = products.find(p => p.id === item.productId);
      const costToUse = prod ? prod.cost : item.price * 0.8; // default fallback cost
      return innerSum + (costToUse * item.quantity);
    }, 0);
  }, 0);
  const totalProfitVal = totalSalesVal - totalCostOfSoldGoods;

  // 2. PRODUCT SALE PERFORMANCE IN THE SELECTED PERIOD
  const getProductSharesForPeriod = () => {
    const shares: { [prodId: string]: { name: string; sku: string; qty: number; revenue: number } } = {};
    
    periodFilteredOrders.forEach(o => {
      o.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const sku = prod ? prod.sku : '';
        if (!shares[item.productId]) {
          shares[item.productId] = {
            name: item.name,
            sku,
            qty: 0,
            revenue: 0
          };
        }
        shares[item.productId].qty += item.quantity;
        shares[item.productId].revenue += item.price * item.quantity;
      });
    });

    return Object.values(shares).sort((a, b) => b.qty - a.qty).slice(0, 5);
  };

  const topSellingPeriodProducts = getProductSharesForPeriod();

  // 3. EMPLOYEE SALES CALCULATION
  const getEmployeeSalesPerformance = () => {
    // We map over System Users (who login and sell products)
    return users.map(user => {
      const empOrders = orders.filter(o => o.createdBy === user.id || o.createdBy === user.email);
      const totalAmountSold = empOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const matchingEmpRecord = employees.find(e => e.email.toLowerCase() === user.email.toLowerCase());
      
      return {
        user,
        designation: user.designation || matchingEmpRecord?.designation || (user.role === 'admin' ? 'কোম্পানি এডমিন' : 'সেলস স্টাফ'),
        salesCount: empOrders.length,
        totalSalesValue: totalAmountSold,
        ordersList: empOrders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      };
    });
  };

  const employeePerformanceList = getEmployeeSalesPerformance().filter(emp => {
    if (!empSearch) return true;
    return emp.user.name.toLowerCase().includes(empSearch.toLowerCase()) || 
           emp.user.email.toLowerCase().includes(empSearch.toLowerCase()) ||
           emp.designation.toLowerCase().includes(empSearch.toLowerCase());
  });

  // PDF Download Helper
  const downloadPDFInvoice = (order: Order) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Top Header Banner
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(0, 0, 210, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('INVOICE / BILL', 15, 25);

    // Bill metadata
    doc.setFontSize(10);
    doc.text(`Invoice No: ${order.invoiceNumber}`, 145, 18);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-GB')}`, 145, 24);
    doc.text(`Billing Status: ${order.paymentStatus.toUpperCase()}`, 145, 30);

    // Organization info
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text('INVENTORY MANAGEMENT LTD.', 15, 55);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Abedin Tower, 4th Floor', 15, 60);
    doc.text('Road 11, Banani, Dhaka, Bangladesh', 15, 65);
    doc.text('Email: info@inventory.com | Tel: +8802999901', 15, 70);

    // Customer info
    const customer = customers.find(c => c.id === order.customerId);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text('BILL TO (CUSTOMER INFO):', 120, 55);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Name: ${order.customerName}`, 120, 60);
    doc.text(`Phone: ${customer?.phone || 'N/A'}`, 120, 65);
    doc.text(`Address: ${customer?.address || 'N/A'}`, 120, 70);

    doc.setDrawColor(226, 232, 240);
    doc.line(15, 78, 195, 78);

    // Itemized table header
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 84, 180, 8, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('SL No.', 18, 89);
    doc.text('Product Item & SKU', 35, 89);
    doc.text('Unit Price', 105, 89);
    doc.text('Qty', 135, 89);
    doc.text('Total Amount', 160, 89);

    // Items list
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    let yPos = 97;
    order.items.forEach((item, index) => {
      const prod = products.find(p => p.id === item.productId);
      const skuText = prod ? `(${prod.sku})` : '';
      
      doc.text(`${index + 1}`, 18, yPos);
      doc.text(`${item.name} ${skuText}`, 35, yPos);
      doc.text(`BDT ${item.price.toLocaleString('en-IN')}`, 105, yPos);
      doc.text(`${item.quantity}`, 135, yPos);
      doc.text(`BDT ${(item.price * item.quantity).toLocaleString('en-IN')}`, 160, yPos);
      
      doc.setDrawColor(241, 245, 249);
      doc.line(15, yPos + 3, 195, yPos + 3);
      yPos += 10;
    });

    // Subtotal and Grand info
    yPos += 5;
    doc.setFont('Helvetica', 'bold');
    doc.text('Subtotal:', 125, yPos);
    doc.text(`BDT ${order.subtotal.toLocaleString('en-IN')}`, 160, yPos);

    yPos += 6;
    doc.text('Discount:', 125, yPos);
    doc.text(`BDT ${order.discount.toLocaleString('en-IN')}`, 160, yPos);

    yPos += 7;
    doc.setFillColor(238, 242, 255);
    doc.rect(120, yPos - 5, 75, 8, 'F');
    doc.setTextColor(79, 70, 229);
    doc.text('Grand Total:', 125, yPos);
    doc.text(`BDT ${order.totalAmount.toLocaleString('en-IN')}`, 160, yPos);

    // Info notes
    yPos += 30;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text('* This is an electronically generated receipt verified by staff.', 15, yPos);
    doc.text('* Thank you for your support!', 15, yPos + 4);

    doc.save(`Invoice_${order.invoiceNumber}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in-25 duration-150" id="reports_root_view">
      
      {/* Header Info Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">📊 সেলস অডিট ও কর্মচারী পারফরম্যান্স হিসাব</h2>
          <p className="text-xs text-slate-500">কালানুক্রমিক বিক্রয় খতিয়ান, ডাইনামিক ডেটা ফিল্টার ও কর্মচারীভিত্তিক ইতিহাস</p>
        </div>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('period_reports')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'period_reports'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-100'
            }`}
          >
            📊 পর্যায়ভিত্তিক রিপোর্ট
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('employee_performance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'employee_performance'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-100'
            }`}
          >
            👥 কর্মচারী বিক্রয় খাতা
          </button>
        </div>
      </div>

      {activeTab === 'period_reports' && (
        <div className="space-y-6">
          {/* Calendar Period Selection Button Row */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 leading-normal">
              <Calendar className="w-4.5 h-4.5 text-indigo-500" /> অডিট সময়সীমা নির্বাচন করুন (Audit Period):
            </span>
            
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'daily', label: 'আজকের রিপোর্ট (Daily)' },
                { id: 'weekly', label: 'সাপ্তাহিক রিপোর্ট (Weekly)' },
                { id: 'monthly', label: 'চলতি মাসিক (Monthly)' },
                { id: '6monthly', label: '৬ মাসের রিপোর্ট (6-Month)' },
                { id: 'yearly', label: 'বার্ষিক রিপোর্ট (Yearly)' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedPeriod(opt.id as PeriodType)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                    selectedPeriod === opt.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-650 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Period Financial Summaries Grid Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sales Volume */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-xs font-medium truncate">সর্বমোট বিক্রয় (Total Sales)</p>
                <p className="text-xl font-bold text-slate-800 tracking-tight text-ellipsis mt-0.5">{formatCurrency(totalSalesVal)}</p>
                <span className="text-[10px] text-slate-400 block mt-0.5">নিট পরিশোধিত ও আংশিক বিল</span>
              </div>
            </div>

            {/* Profits Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Coins className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-xs font-medium">নিট লভ্যাংশ (Net Margin %)</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {isAdmin ? formatCurrency(totalProfitVal) : '🔒 শুধুমাত্র এডমিন'}
                </p>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {isAdmin ? `প্রসারিত প্রফিট মার্জিন: ${totalSalesVal > 0 ? Math.round((totalProfitVal/totalSalesVal)*100) : 0}%` : 'এডমিনের গোপনীয় ডেটা'}
                </span>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium">সম্পূর্ণ বিক্রয় মেমো (Orders)</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{totalOrdersCount} টি ইনভয়েস</p>
                <span className="text-[10px] text-slate-400 block mt-0.5">মোট লেনদেন সম্পন্ন হয়েছে</span>
              </div>
            </div>

            {/* Total items qty */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-500 text-xs font-medium">মোট বিক্রিত পিস পণ্য (Items Qty)</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{totalItemsCount} পিস মাল</p>
                <span className="text-[10px] text-slate-400 block mt-0.5">ইনভেন্টরি থেকে হ্যান্ডওভার</span>
              </div>
            </div>
          </div>

          {/* Two-Column split containing Top Products and recent orders of the period */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top 5 Products of Period */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-1">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-indigo-500" /> নির্বাচিত সময়সীমার সেরা ৫ পণ্য
              </h3>
              
              <div className="space-y-4 pt-4">
                {topSellingPeriodProducts.map((p, index) => {
                  const maxQty = Math.max(...topSellingPeriodProducts.map(item => item.qty), 1);
                  const sharePercent = Math.min((p.qty / maxQty) * 100, 100);
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span className="truncate max-w-[150px]">{p.name} <span className="font-mono text-[9px] text-slate-400">({p.sku})</span></span>
                        <span className="font-bold flex items-center gap-1">
                          {p.qty} টি <span className="text-slate-400">({formatCurrency(p.revenue)})</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-50 rounded-full h-1.5 border border-slate-100">
                        <div 
                          className="bg-indigo-655 bg-indigo-505 h-1.5 bg-indigo-600 rounded-full" 
                          style={{ width: `${sharePercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {topSellingPeriodProducts.length === 0 && (
                  <p className="text-slate-400 text-xs text-center py-10">কোনো পণ্য সামগ্রী বিক্রয় রেকর্ড পাওয়া যায়নি।</p>
                )}
              </div>
            </div>

            {/* Invoices List for Selected Period */}
            <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4 text-indigo-500" /> সময়সীমা অডিট ট্রেইল রশিদ তালিকা
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">সব ইনভয়েস ক্যাশ মেমো যা নির্ধারিত সময়সীমার মধ্যে ইস্যু করা হয়েছে</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-650">
                  <thead className="bg-slate-55 bg-slate-50 text-slate-700 font-bold rounded-lg select-none">
                    <tr>
                      <th className="p-3">রশিদ নং</th>
                      <th className="p-3">গ্রাহক</th>
                      <th className="p-3">তারিখ ও সময়</th>
                      <th className="p-3 text-right">আইটেমসমূহ</th>
                      <th className="p-3">মোট দাম (Taka)</th>
                      <th className="p-3 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {periodFilteredOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3 font-bold text-slate-800 font-mono">{o.invoiceNumber}</td>
                        <td className="p-3 font-semibold text-slate-700">{o.customerName}</td>
                        <td className="p-3 text-slate-500">
                          {new Date(o.createdAt).toLocaleDateString('en-GB')} {new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-800">
                          {o.items.reduce((s, item) => s + item.quantity, 0)} পিস
                        </td>
                        <td className="p-3 font-bold text-slate-900">{formatCurrency(o.totalAmount)}</td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => downloadPDFInvoice(o)}
                            className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-200 transition font-semibold cursor-pointer text-[10px] inline-flex items-center gap-1"
                          >
                            <FileDown className="w-3 h-3" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                    {periodFilteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400">এই সময়কালের কোনো বিক্রয় রশিদ নেই।</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'employee_performance' && (
        <div className="space-y-6">
          
          {/* Employee Search Box */}
          <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs font-bold text-slate-750 flex items-center gap-1.5 select-none leading-normal shrink-0">
              <Users className="w-4.5 h-4.5 text-indigo-500" /> কর্মচারীভিত্তিক পারফরম্যান্স এবং হিস্ট্রি অনুসন্ধান:
            </span>
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="কর্মচারীর নাম, ইমেইল বা পদবী দিয়ে খুঁজুন..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
              />
            </div>
          </div>

          {/* Grid list of employees and stats summaries */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {employeePerformanceList.map((emp) => (
              <div 
                key={emp.user.id} 
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                {/* Employee Initials Header */}
                <div className="flex gap-3 items-start">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-sm shrink-0">
                    {emp.user.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-[13px] truncate">{emp.user.name}</p>
                    <p className="text-slate-500 text-[11px] font-medium truncate mt-0.5">{emp.designation}</p>
                    <p className="text-slate-400 text-[10px] truncate mt-0.5">{emp.user.email}</p>
                  </div>
                </div>

                {/* Performance Analytics metrics */}
                <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-50 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                  <div className="p-1">
                    <span className="block text-[10px] text-slate-500 font-medium">সর্বমোট বিক্রি সংখ্যা</span>
                    <span className="font-extrabold text-sm text-slate-800 block mt-0.5">{emp.salesCount} টি মেমো</span>
                  </div>
                  <div className="p-1 border-l border-slate-100">
                    <span className="block text-[10px] text-slate-500 font-medium">টাকা পরিমাণ বিক্রি</span>
                    <span className="font-extrabold text-sm text-indigo-600 block mt-0.5">{formatCurrency(emp.totalSalesValue)}</span>
                  </div>
                </div>

                {/* Detail View action triggers */}
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeOrders(emp.user)}
                  className="w-full py-2 bg-slate-900 group hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer transition shadow-xs"
                >
                  বিক্রয় লগ ও রশিদ ইতিহাস <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
            {employeePerformanceList.length === 0 && (
              <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-100 border-dashed">
                <Users className="w-10 h-10 text-slate-350 mx-auto mb-2.5" />
                <p className="text-slate-400 text-xs">কোনো কর্মচারী ডাটা পাওয়া যায়নি।</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR EMPLOYEE SALES HISTORY */}
      {selectedEmployeeOrders && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl shadow-xl overflow-hidden animate-in fade-in-50 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-md font-bold">👤 {selectedEmployeeOrders.name} - এর বিক্রয় খতিয়ান</h3>
                <p className="text-[10px] text-slate-300 mt-1">
                  পদবীঃ {selectedEmployeeOrders.designation || 'স্টাফ কর্মচারী'} | ইমেইলঃ {selectedEmployeeOrders.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployeeOrders(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                বন্ধ করুন
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
              
              {/* Employee Summary Card Block */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-indigo-50/50 p-4 border border-indigo-100 rounded-2xl">
                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold mb-0.5">মোট তৈরি ইনভয়েস কেল্লভ</span>
                  <span className="font-extrabold text-md text-slate-800">
                    {orders.filter(o => o.createdBy === selectedEmployeeOrders.id || o.createdBy === selectedEmployeeOrders.email).length} টি মেমো
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold mb-0.5">মোট বিক্রয় রেভিনিউ</span>
                  <span className="font-extrabold text-md text-indigo-650 text-indigo-600">
                    {formatCurrency(orders.filter(o => o.createdBy === selectedEmployeeOrders.id || o.createdBy === selectedEmployeeOrders.email).reduce((sum, o) => sum + o.totalAmount, 0))}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-semibold mb-0.5">যোগদান সময় খসড়া</span>
                  <span className="font-bold text-xs text-slate-700 block mt-0.5">
                    {selectedEmployeeOrders.joinedDate ? new Date(selectedEmployeeOrders.joinedDate).toLocaleDateString('en-GB') : 'কোম্পানি সূচনা'}
                  </span>
                </div>
              </div>

              {/* Transactions List */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3">রশিদ নং</th>
                      <th className="p-3">গ্রাহকের নাম</th>
                      <th className="p-3">তারিখ ও সময়</th>
                      <th className="p-3 text-right">আইটেম সংখ্যা</th>
                      <th className="p-3">মোট দাম (Taka)</th>
                      <th className="p-3">পরিশোধ অবস্থা</th>
                      <th className="p-3 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders
                      .filter(o => o.createdBy === selectedEmployeeOrders.id || o.createdBy === selectedEmployeeOrders.email)
                      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((o) => (
                        <tr key={o.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-800 font-mono">{o.invoiceNumber}</td>
                          <td className="p-3 font-semibold text-slate-700">{o.customerName}</td>
                          <td className="p-3 text-slate-500">
                            {new Date(o.createdAt).toLocaleDateString('en-GB')} {new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-700">
                            {o.items.reduce((sum, i) => sum + i.quantity, 0)} পিস
                          </td>
                          <td className="p-3 font-bold text-slate-900">{formatCurrency(o.totalAmount)}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              o.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                              o.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {o.paymentStatus === 'Paid' ? 'পরিশোধিত' :
                               o.paymentStatus === 'Partial' ? 'আংশিক' : 'অপরিশোধিত'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => downloadPDFInvoice(o)}
                              className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-200 transition font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <FileDown className="w-3.5 h-3.5" /> PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    {orders.filter(o => o.createdBy === selectedEmployeeOrders.id || o.createdBy === selectedEmployeeOrders.email).length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">এই কর্মচারীর মাধ্যমে ইস্যুকৃত কোনো বিক্রয় কেল্লভ নেই।</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEmployeeOrders(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
