import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Search, Filter, AlertTriangle, ShieldCheck, Check, Database, X 
} from 'lucide-react';
import { Product, Category, Brand, User, Supplier } from '../types.js';

interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  activeUser: User;
  onAddProduct: (prod: Partial<Product>) => Promise<any>;
  onUpdateProduct: (id: string, prod: Partial<Product>) => Promise<any>;
  onDeleteProduct: (id: string) => Promise<any>;
}

export default function ProductsView({ 
  products, categories, brands, suppliers, activeUser, onAddProduct, onUpdateProduct, onDeleteProduct 
}: ProductsViewProps) {
  const isAdmin = activeUser.role === 'admin';
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formPrice, setFormPrice] = useState('0');
  const [formCost, setFormCost] = useState('0');
  const [formQuantity, setFormQuantity] = useState('0');
  const [formThreshold, setFormThreshold] = useState('5');
  const [formDescription, setFormDescription] = useState('');
  const [errorStatus, setErrorStatus] = useState('');

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormSku('SKU-' + Math.floor(100000 + Math.random() * 900000));
    setFormCategory(categories[0]?.id || '');
    setFormBrand(brands[0]?.id || '');
    setFormSupplier(suppliers[0]?.id || '');
    setFormPrice('1500');
    setFormCost('1100');
    setFormQuantity('20');
    setFormThreshold('5');
    setFormDescription('');
    setErrorStatus('');
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategory(p.categoryId);
    setFormBrand(p.brandId);
    setFormSupplier(p.supplierId || '');
    setFormPrice(String(p.price));
    setFormCost(String(p.cost));
    setFormQuantity(String(p.quantity));
    setFormThreshold(String(p.lowStockThreshold));
    setFormDescription(p.description);
    setErrorStatus('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus('');

    if (!formName || !formSku) {
      setErrorStatus('পণ্যটির নাম এবং SKU কোড প্রদান করা আবশ্যক।');
      return;
    }

    const payload = {
      name: formName,
      sku: formSku,
      categoryId: formCategory,
      brandId: formBrand,
      supplierId: formSupplier,
      price: Number(formPrice) || 0,
      cost: Number(formCost) || 0,
      quantity: Number(formQuantity) || 0,
      lowStockThreshold: Number(formThreshold) || 5,
      description: formDescription
    };

    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, payload);
      } else {
        await onAddProduct(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setErrorStatus(err.message || 'পণ্য সংরক্ষণ করতে সমস্যা হয়েছে।');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) {
      alert('দুঃখিত, শুধুমাত্র এডমিনরা পণ্য ডিলিট করতে পারবেন।');
      return;
    }
    if (confirm(`আপনি কি নিশ্চিতভাবে "${name}" পণ্যটি ইনভেন্টরি থেকে অবলুপ্ত করতে চান?`)) {
      try {
        await onDeleteProduct(id);
      } catch (err: any) {
        alert(err.message || 'পণ্য ডিলিট করতে সমস্যা হয়েছে');
      }
    }
  };

  // Safe names finder helper
  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || 'N/A';
  const getBrandName = (id: string) => brands.find(b => b.id === id)?.name || 'N/A';
  const getSupplierName = (id?: string) => id ? suppliers.find(s => s.id === id)?.companyName || 'N/A' : 'N/A';

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase()) ||
                          p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? p.categoryId === selectedCategory : true;
    const matchesBrand = selectedBrand ? p.brandId === selectedBrand : true;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  return (
    <div className="space-y-6" id="products_view">
      {/* Top Banner and Filter search controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">মজুদ পণ্য তালিকা ও ইনভেন্টরি হায়ারার্কি</h2>
            <p className="text-xs text-slate-500">স্টক এবং থ্রেশহোল্ড সংবেদনশীলতা কন্ট্রোলার</p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 transition text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" /> নতুন পণ্য যোগ করুন
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="পণ্য বা SKU দিয়ে খুঁজুন..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
            >
              <option value="">সব ক্যাটাগরি</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
            >
              <option value="">সব ব্র্যান্ড</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div className="flex justify-end items-center text-xs text-slate-500 font-medium">
            সর্বমোট পণ্য: {filteredProducts.length} টি
          </div>
        </div>
      </div>

      {/* Grid view of Products */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold">
              <tr>
                <th className="p-4">SKU ও নাম</th>
                <th className="p-4">ক্যাটাগরি/ব্র্যান্ড</th>
                <th className="p-4">ক্রয়মূল্য</th>
                <th className="p-4">বিক্রয়মূল্য</th>
                <th className="p-4 text-center">ইনভেন্টরি স্টক</th>
                <th className="p-4">স্টক স্ট্যাটাস</th>
                <th className="p-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLowStock = p.quantity <= p.lowStockThreshold;
                const progressWidth = Math.min((p.quantity / 50) * 100, 100);

                return (
                  <tr key={p.id} className={`hover:bg-slate-50/50 transition ${isLowStock ? 'bg-amber-50/20' : ''}`}>
                    <td className="p-4">
                      <div>
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          {p.sku}
                        </span>
                        <p className="font-bold text-slate-800 text-sm mt-1">{p.name}</p>
                        <p className="text-[11px] text-slate-500 text-ellipsis overflow-hidden max-w-xs whitespace-nowrap">{p.description}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <span className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded font-bold">
                          {getCategoryName(p.categoryId)}
                        </span>
                        <span className="block text-[11px] text-slate-500 font-medium">
                          ব্র্যান্ড: {getBrandName(p.brandId)}
                        </span>
                        <span className="block text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                          সাপ্লায়ার: {getSupplierName(p.supplierId)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      {isAdmin ? `৳${p.cost.toLocaleString('en-IN')}` : '🔒'}
                    </td>
                    <td className="p-4 font-bold text-indigo-600 text-[13px]">
                      ৳{p.price.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-extrabold ${isLowStock ? 'text-amber-600' : 'text-slate-800'}`}>
                          {p.quantity} পিস
                        </span>
                        <div className="w-20 bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className={`h-full ${isLowStock ? 'bg-amber-500' : 'bg-indigo-600'}`}
                            style={{ width: `${progressWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/70 border border-amber-200/50 px-2.5 py-1 rounded-full animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" /> রি-অর্ডার করুন
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200/50 px-2.5 py-1 rounded-full">
                          <ShieldCheck className="w-3.5 h-3.5" /> পর্যাপ্ত মজুদ
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 text-slate-500 transition rounded-lg border border-slate-200 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={!isAdmin}
                          className={`p-1 px-2.5 transition rounded-lg border border-slate-200 cursor-pointer ${
                            isAdmin 
                              ? 'bg-rose-50 hover:bg-rose-100 hover:border-rose-300 text-rose-600' 
                              : 'bg-slate-50 text-slate-300 cursor-not-allowed border-none'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">ইনভেন্টরিতে কোনো মেলানো পণ্য পাওয়া যায়নি!</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Input/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{editingProduct ? 'পণ্য সংশোধন করুন' : 'নতুন পণ্য যুক্ত করুন'}</h3>
                <p className="text-slate-300 text-xs mt-0.5">১০০% রিয়েল-টাইম ক্যাটালগ আপডেটার</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-slate-800 hover:bg-slate-700/80 rounded-lg text-slate-300 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorStatus && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {errorStatus}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 text-xs font-bold mb-1">পণ্যের নাম (Product Name) *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="যেমনঃ iPhone 15 Pro Max, Logitech MX mouse etc."
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">SKU কোড *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full px-3.5 py-2 font-mono text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">ক্যাটাগরি *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">ব্র্যান্ড ও পার্টনার *</label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl bg-white"
                  >
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">সরবরাহকারী (Supplier) *</label>
                  <select
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl bg-white text-slate-800"
                  >
                    <option value="">সরবরাহকারী নির্বাচন করুন...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.companyName} ({s.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">মজুদ কোয়ান্টিটি (Qty) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">ক্রয়মূল্য (Buying Cost) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formCost}
                    disabled={!isAdmin}
                    onChange={(e) => setFormCost(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">বিক্রয়মূল্য (Selling Price) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">অ্যালার্ট থ্রেশহোল্ড (Low Stock Alert) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    placeholder="যেমনঃ ৫ পিস"
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl font-bold text-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">পণ্যের বিবরণ (Description)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="পণ্য সম্পর্কে বিস্তারিত তথ্য এখানে লিখুন..."
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                />
              </div>

              {/* Threshold Warning Preview */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-800 leading-relaxed">
                ℹ️ <b>স্বয়ংক্রিয় ইমেইল অ্যালার্ট:</b> স্টক লেভেল যদি <b>{formThreshold || 5} পিসের</b> সমান বা নিচে নেমে যায়, সিস্টেম স্বয়ংক্রিয়ভাবে একটি মেইল ও নোটিফিকেশন অ্যালার্ট ট্রিগার করবে।
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Check className="w-4 h-4" /> সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
