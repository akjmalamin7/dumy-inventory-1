import React, { useState } from 'react';
import { Plus, FolderPlus, Layers, Trash2, Edit2, Check, X, Tag } from 'lucide-react';
import { Category, Brand, User } from '../types.js';

interface CategoriesAndBrandsViewProps {
  categories: Category[];
  brands: Brand[];
  activeUser: User;
  onAddCategory: (cat: { name: string; description: string }) => Promise<any>;
  onAddBrand: (brand: { name: string; description: string }) => Promise<any>;
}

export default function CategoriesAndBrandsView({
  categories, brands, activeUser, onAddCategory, onAddBrand
}: CategoriesAndBrandsViewProps) {
  const isAdmin = activeUser.role === 'admin';
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandDesc, setBrandDesc] = useState('');

  const [catError, setCatError] = useState('');
  const [brandError, setBrandError] = useState('');

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');
    if (!catName) {
      setCatError('ক্যাটাগরি টাইটেল আবশ্যক।');
      return;
    }
    try {
      await onAddCategory({ name: catName, description: catDesc });
      setCatName('');
      setCatDesc('');
    } catch (err: any) {
      setCatError(err.message || 'ক্যাটাগরি যোগ হতে কোনো সমস্যা হয়েছে।');
    }
  };

  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandError('');
    if (!brandName) {
      setBrandError('ব্র্যান্ডের নাম আবশ্যক।');
      return;
    }
    try {
      await onAddBrand({ name: brandName, description: brandDesc });
      setBrandName('');
      setBrandDesc('');
    } catch (err: any) {
      setBrandError(err.message || 'ব্র্যান্ড যোগ হতে কোনো সমস্যা হয়েছে।');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="categories_brands_view">
      {/* Category Card panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> পণ্য ক্যাটাগরি প্যানেল (Product Categories)
          </h2>
          <p className="text-xs text-slate-500">ইনভেন্টরি পণ্য সুবিন্যস্ত করতে ক্যাটাগরি তৈরি করুন</p>
        </div>

        {/* Categories form */}
        <form onSubmit={handleCreateCategory} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
          <p className="text-xs font-bold text-slate-700">নতুন ক্যাটাগরি তৈরি করুন</p>
          {catError && (
            <div className="text-[11px] bg-red-100 text-red-700 p-2 rounded-lg">{catError}</div>
          )}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="ক্যাটাগরির নাম (যেমন: ল্যাপটপ, অ্যাক্সেসরিজ)..."
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-xl focus:outline-none"
            />
            <input
              type="text"
              placeholder="ক্যাটাগরির সংক্ষিপ্ত বিবরণ..."
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-xl focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex justify-center items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> ক্যাটাগরি সেভ করুন
            </button>
          </div>
        </form>

        {/* Categories List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {categories.map((c) => (
            <div key={c.id} className="p-3 bg-white border border-slate-100 hover:border-slate-200 rounded-xl shadow-xs transition flex justify-between items-center gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800">{c.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{c.description || 'কোনো বর্ণনা নেই'}</p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded font-bold shrink-0">{c.id}</span>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-slate-400 text-xs text-center py-6">কোনো ক্যাটাগরি তৈরি করা হয়নি।</p>
          )}
        </div>
      </div>

      {/* Brand Card panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" /> প্রোডাক্ট ব্র্যান্ড পার্টনার (Brands)
          </h2>
          <p className="text-xs text-slate-500">ইনভেন্টরি ব্র্যান্ড ও ডিস্ট্রিবিউটর তালিকা</p>
        </div>

        {/* Brand form */}
        <form onSubmit={handleCreateBrand} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
          <p className="text-xs font-bold text-slate-700">নতুন ব্র্যান্ড যোগ করুন</p>
          {brandError && (
            <div className="text-[11px] bg-red-100 text-red-700 p-2 rounded-lg">{brandError}</div>
          )}
          <div className="space-y-2">
            <input
              type="text"
              placeholder="ব্র্যান্ডের নাম (যেমন: Apple, Samsung)..."
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-xl focus:outline-none"
            />
            <input
              type="text"
              placeholder="ব্র্যান্ডের সংক্ষিপ্ত পরিচয় বা বিবরণ..."
              value={brandDesc}
              onChange={(e) => setBrandDesc(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500 rounded-xl focus:outline-none"
            />
            <button
              type="submit"
              className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex justify-center items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> ব্র্যান্ড সেভ করুন
            </button>
          </div>
        </form>

        {/* Brands List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {brands.map((b) => (
            <div key={b.id} className="p-3 bg-white border border-slate-100 hover:border-slate-200 rounded-xl shadow-xs transition flex justify-between items-center gap-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800">{b.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{b.description || 'কোনো বর্ণনা নেই'}</p>
              </div>
              <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded font-bold shrink-0">{b.id}</span>
            </div>
          ))}
          {brands.length === 0 && (
            <p className="text-slate-400 text-xs text-center py-6">কোনো ব্র্যান্ড যুক্ত করা হয়নি।</p>
          )}
        </div>
      </div>
    </div>
  );
}
