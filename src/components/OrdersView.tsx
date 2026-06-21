import React, { useState } from 'react';
import { 
  FileText, Plus, ShoppingCart, Trash, CheckCircle, FileDown, Eye, Search, AlertCircle 
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Order, Product, Customer, User } from '../types.js';

interface OrdersViewProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  activeUser: User;
  onCreateOrder: (orderData: {
    customerId: string;
    items: { productId: string; quantity: number; price: number }[];
    discount: number;
    paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
    createdBy: string;
  }) => Promise<any>;
}

export default function OrdersView({
  orders, products, customers, activeUser, onCreateOrder
}: OrdersViewProps) {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // New Order Cart Form States
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [orderCustomer, setOrderCustomer] = useState('');
  const [cartItems, setCartItems] = useState<{ productId: string; quantity: number; price: number }[]>([]);
  const [currentProduct, setCurrentProduct] = useState('');
  const [currentQty, setCurrentQty] = useState(1);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [orderPaymentStatus, setOrderPaymentStatus] = useState<'Paid' | 'Unpaid' | 'Partial'>('Paid');
  const [orderError, setOrderError] = useState('');

  // Cart actions
  const addCartItem = () => {
    setOrderError('');
    if (!currentProduct) return;

    const prod = products.find(p => p.id === currentProduct);
    if (!prod) return;

    if (prod.quantity < currentQty) {
      setOrderError(`দুঃখিত, "${prod.name}" পণ্যটির পর্যাপ্ত স্টক নেই। বর্তমান মজুদ: ${prod.quantity} পিস`);
      return;
    }

    // Check if product is already in cart
    const existingIndex = cartItems.findIndex(item => item.productId === currentProduct);
    if (existingIndex > -1) {
      const updatedCart = [...cartItems];
      const newQty = updatedCart[existingIndex].quantity + currentQty;
      if (prod.quantity < newQty) {
        setOrderError(`দুঃখিত, এই পণ্যের সর্বোচ্চ ${prod.quantity} পিস অর্ডার করা সম্ভব।`);
        return;
      }
      updatedCart[existingIndex].quantity = newQty;
      setCartItems(updatedCart);
    } else {
      setCartItems([...cartItems, {
        productId: currentProduct,
        quantity: currentQty,
        price: prod.price
      }]);
    }

    setCurrentQty(1);
  };

  const removeCartItem = (idx: number) => {
    const updated = [...cartItems];
    updated.splice(idx, 1);
    setCartItems(updated);
  };

  // Compute Cart stats
  const cartSubtotal = cartItems.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
  const cartTotal = Math.max(0, cartSubtotal - orderDiscount);

  // Submit new Sales order
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError('');

    if (!orderCustomer) {
      setOrderError('দয়া করে একজন গ্রাহক নির্বাচন করুন।');
      return;
    }
    if (!cartItems.length) {
      setOrderError('কার্টে অন্তত একটি পণ্য যোগ করা আবশ্যক।');
      return;
    }

    try {
      const payload = {
        customerId: orderCustomer,
        items: cartItems,
        discount: Number(orderDiscount) || 0,
        paymentStatus: orderPaymentStatus,
        createdBy: activeUser.id
      };
      
      const res = await onCreateOrder(payload);
      
      // Auto-open created invoice
      setSelectedOrder(res);
      setIsInvoiceModalOpen(true);
      
      // Clear cart
      setCartItems([]);
      setOrderCustomer('');
      setOrderDiscount(0);
      setIsNewOrderOpen(false);
    } catch (err: any) {
      setOrderError(err.message || 'অর্ডারটি সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  // Generate and Download PDF Invoice using jsPDF (Client-Side HTML Canvas equivalent)
  const downloadPDFInvoice = (order: Order) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = '#1e293b'; //slate-800
    const accentColor = '#4f46e5'; //indigo-600

    // Header styling
    doc.setFillColor(30, 41, 59); //Slate-800 background for top bar
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

    // Company info
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text('INVENTORY MANAGEMENT LTD.', 15, 55);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Abedin Tower, 4th Floor', 15, 60);
    doc.text('Road 11, Banani, Dhaka, Bangladesh', 15, 65);
    doc.text('Email: info@inventory.com | Tel: +8802999901', 15, 70);

    // Customer details
    const customer = customers.find(c => c.id === order.customerId);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text('BILL TO (CUSTOMER INFO):', 120, 55);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Name: ${order.customerName}`, 120, 60);
    doc.text(`Phone: ${customer?.phone || 'N/A'}`, 120, 65);
    doc.text(`Address: ${customer?.address || 'N/A'}`, 120, 70);

    // Decorative line
    doc.setDrawColor(226, 232, 240); //slate-200
    doc.line(15, 78, 195, 78);

    // Itemized table header
    doc.setFillColor(241, 245, 249); //slate-100
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
      
      // Draw minimal row border line
      doc.setDrawColor(241, 245, 249);
      doc.line(15, yPos + 3, 195, yPos + 3);
      yPos += 10;
    });

    // Summary calculations block
    yPos += 5;
    doc.setFont('Helvetica', 'bold');
    doc.text('Subtotal:', 125, yPos);
    doc.text(`BDT ${order.subtotal.toLocaleString('en-IN')}`, 160, yPos);

    yPos += 6;
    doc.text('Discount:', 125, yPos);
    doc.text(`BDT ${order.discount.toLocaleString('en-IN')}`, 160, yPos);

    yPos += 7;
    doc.setFillColor(238, 242, 255); // light indigo background
    doc.rect(120, yPos - 5, 75, 8, 'F');
    doc.setTextColor(79, 70, 229); //Indigo
    doc.text('Grand Total:', 125, yPos);
    doc.text(`BDT ${order.totalAmount.toLocaleString('en-IN')}`, 160, yPos);

    // Terms & signature block at bottom
    yPos += 30;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(148, 163, 184); //slate-400
    doc.setFontSize(8);
    doc.text('* This is an electronically generated document. No physical signature required.', 15, yPos);
    doc.text('* Thank you for doing business with us!', 15, yPos + 4);

    doc.setDrawColor(203, 213, 225);
    doc.line(150, yPos + 10, 190, yPos + 10);
    doc.text('Authorized Signature', 155, yPos + 14);

    doc.save(`Invoice_${order.invoiceNumber}.pdf`);
  };

  return (
    <div className="space-y-6" id="orders_view">
      {/* Sales Toolbar Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">পণ্য বিক্রয় ও ইনভয়েস রশীদ জেনারেটর</h2>
          <p className="text-xs text-slate-500">স্টক চেক, নতুন সেলস এন্ট্রি ও ইনস্ট্যান্ট PDF invoice ডাউনলোড</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsNewOrderOpen(!isNewOrderOpen);
            setCartItems([]);
            setOrderError('');
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
        >
          <ShoppingCart className="w-4 h-4" /> {isNewOrderOpen ? 'রশীদ তালিকা দেখুন' : 'নতুন বিক্রয় রশিদ এন্ট্রি'}
        </button>
      </div>

      {isNewOrderOpen ? (
        /* Create invoice cart layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">শপিং কার্ট ও পণ্য বাছাই (Order Cart)</h3>
            
            {orderError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {orderError}
              </div>
            )}

            {/* Cart Selector Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 items-end">
              <div className="sm:col-span-2">
                <label className="block text-slate-700 text-[11px] font-bold mb-1">পণ্য নির্বাচন করুন (Product)</label>
                <select
                  value={currentProduct}
                  onChange={(e) => setCurrentProduct(e.target.value)}
                  className="w-full p-2 text-xs bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                >
                  <option value="">পণ্য সিলেক্ট করুন...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.quantity <= 0}>
                      {p.name} (SKU: {p.sku}) — স্টক: {p.quantity} পিস | ৳{p.price.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-[11px] font-bold mb-1">পরিমাণ (Qty)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={currentQty}
                    onChange={(e) => setCurrentQty(Math.max(1, Number(e.target.value)))}
                    className="w-16 p-2 text-xs text-center bg-white border border-slate-200 focus:outline-none rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={addCartItem}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs p-2 rounded-xl cursor-pointer"
                  >
                    যোগ করুন
                  </button>
                </div>
              </div>
            </div>

            {/* Table of added Cart Items */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold">
                    <th className="p-3">পণ্যের নাম</th>
                    <th className="p-3">একক মূল্য</th>
                    <th className="p-3">পরিমাণ</th>
                    <th className="p-3">মোট মূল্য</th>
                    <th className="p-3 text-right">পদক্ষেপ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cartItems.map((item, index) => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <tr key={index}>
                        <td className="p-3 font-semibold text-slate-800">{prod?.name || 'Unknown'}</td>
                        <td className="p-3 text-slate-600">৳{item.price.toLocaleString('en-IN')}</td>
                        <td className="p-3 font-bold text-slate-700">{item.quantity} পিস</td>
                        <td className="p-3 font-bold text-indigo-600">৳{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => removeCartItem(index)}
                            className="p-1 px-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition shrink-0 cursor-pointer"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {cartItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">কার্ট খালি আছে। পণ্য সিলেক্ট করে যোগ করুন।</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Form details, discount and payment status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <form onSubmit={handleSaveOrder} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">গ্রাহক ও বিলিং নিশ্চিতকরণ</h3>
              
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">গ্রাহক নির্বাচন করুন (Customer) *</label>
                <select
                  required
                  value={orderCustomer}
                  onChange={(e) => setOrderCustomer(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                >
                  <option value="">গ্রাহক তালিকায় সিলেক্ট করুন...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">ছাড়ের পরিমাণ (Discount BDT)</label>
                <input
                  type="number"
                  min="0"
                  value={orderDiscount}
                  onChange={(e) => setOrderDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-full p-2.5 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">পরিশোধের অবস্থা (Payment Status)</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Paid', 'Partial', 'Unpaid'] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setOrderPaymentStatus(status)}
                      className={`p-2 text-[11px] font-bold rounded-xl border transition cursor-pointer text-center ${
                        orderPaymentStatus === status 
                          ? 'bg-slate-900 border-slate-900 text-white' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {status === 'Paid' ? 'পরিশোধিত' : status === 'Partial' ? 'আংশিক' : 'অপরিশোধিত'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-xl space-y-2 mt-4 text-xs font-medium border border-indigo-100 leading-normal">
                <div className="flex justify-between text-slate-600">
                  <span>সাবটোটাল মূল্য:</span>
                  <span>৳{cartSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>টোটাল ছাড়:</span>
                  <span>-৳{orderDiscount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-extrabold text-sm border-t border-indigo-100 pt-2">
                  <span>সর্বমোট প্রদেয় বিল:</span>
                  <span className="text-indigo-600">৳{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex justify-center items-center gap-1.5 cursor-pointer shadow-sm transition mt-6"
              >
                <CheckCircle className="w-4 h-4" /> সেলস ইনভয়েস ইস্যু করুন
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Order History records list */
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">অর্ডার ইনভয়েস ক্যাশ মেমো ইতিহাস</h3>
            <p className="text-xs text-slate-500 mt-0.5">সব সেলস অর্ডার এবং পিডিএফ ইনভয়েস জেনারেটর উইজেট</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold">
                <tr>
                  <th className="p-4">রসিদ নং (Invoice)</th>
                  <th className="p-4">গ্রাহক</th>
                  <th className="p-4">তারিখ</th>
                  <th className="p-4 text-right">আইটেম সংখ্যা</th>
                  <th className="p-4">সর্বমোট দাম (Taka)</th>
                  <th className="p-4">অবস্থা</th>
                  <th className="p-4 text-right">রশীদ ডাউনলোড / ভিউ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-slate-55/40 transition">
                      <td className="p-4 font-bold text-slate-800 font-mono">{order.invoiceNumber}</td>
                      <td className="p-4 font-semibold text-slate-700">{order.customerName}</td>
                      <td className="p-4 text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString('en-GB')} {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-800">{order.items.reduce((sum, i) => sum + i.quantity, 0)} পিস</td>
                      <td className="p-4 font-bold text-slate-900 text-[13px]">৳{order.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          order.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {order.paymentStatus === 'Paid' ? 'পরিশোধিত' :
                           order.paymentStatus === 'Partial' ? 'আংশিক' : 'অপরিশোধিত'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsInvoiceModalOpen(true);
                            }}
                            className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-200 transition cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> রশিদ দেখুন
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadPDFInvoice(order)}
                            className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-200 transition cursor-pointer flex items-center gap-1 font-semibold"
                          >
                            <FileDown className="w-3.5 h-3.5" /> PDF
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">কোনো ইনভয়েস তথ্য পাওয়া যায়নি।</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice View Full Card Modal */}
      {isInvoiceModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl overflow-hidden animate-in fade-in-50 duration-200">
            {/* Invoice Layout design */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">ইনভয়েস বিল রশিদ ({selectedOrder.invoiceNumber})</h3>
                <p className="text-[10px] text-slate-300">ইস্যুর সময়: {new Date(selectedOrder.createdAt).toLocaleString('en-GB')}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[450px] overflow-y-auto">
              {/* Client detail Block */}
              <div className="flex justify-between items-start text-xs text-slate-600 gap-6">
                <div>
                  <h4 className="font-bold text-slate-800">বিক্রেতা প্রতিষ্ঠানঃ</h4>
                  <p className="mt-1 font-semibold text-slate-700">INVENTORY MANAGEMENT SYSTEM</p>
                  <p>Banani Rd 11, Dhaka, Bangladesh</p>
                  <p>Email: info@inventory.com | Tel: +8802999901</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-slate-800">ক্রেতার তথ্য (Bill To):</h4>
                  <p className="mt-1 font-semibold text-slate-700">{selectedOrder.customerName}</p>
                  <p>মোবাইলঃ {customers.find(c => c.id === selectedOrder.customerId)?.phone || 'N/A'}</p>
                  <p>ঠিকানাঃ {customers.find(c => c.id === selectedOrder.customerId)?.address || 'N/A'}</p>
                </div>
              </div>

              {/* Items Summary Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3">পণ্যের নাম</th>
                      <th className="p-3 text-right">একক মূল্য</th>
                      <th className="p-3 text-center">সংখ্যা</th>
                      <th className="p-3 text-right">মোট প্রদেয়</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-semibold text-slate-800">{item.name}</td>
                        <td className="p-3 text-right text-slate-600">৳{item.price.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-center font-bold text-slate-700">{item.quantity} পিস</td>
                        <td className="p-3 text-right font-bold text-slate-900">৳{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Math Summary Calculations */}
              <div className="w-2/3 ml-auto text-xs space-y-2 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-slate-600">
                  <span>সর্বমোট মূল্য:</span>
                  <span>৳{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ডিসকাউন্ট ছাড়:</span>
                  <span>-৳{selectedOrder.discount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-800 font-extrabold text-sm border-t border-slate-200 pt-2 bg-indigo-50/55 p-2 rounded-lg">
                  <span>গ্র্যান্ড টোটাল:</span>
                  <span className="text-indigo-600">৳{selectedOrder.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Actions footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between gap-4">
              <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-xs font-bold ${
                selectedOrder.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                selectedOrder.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
              }`}>
                পেমেন্ট অবস্থাঃ {selectedOrder.paymentStatus === 'Paid' ? 'পরিশোধিত' :
                 selectedOrder.paymentStatus === 'Partial' ? 'আংশিক পরিশোধিত' : 'অপরিশোধিত'}
              </span>

              <button
                type="button"
                onClick={() => downloadPDFInvoice(selectedOrder)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer shrink-0"
              >
                <FileDown className="w-4 h-4" /> PDF ডাউনলোড করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
