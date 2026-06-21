import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Key, AlertCircle, ShoppingBag } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string, pass: string) => Promise<any>;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [errorStatus, setErrorStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus('');
    setLoading(true);

    if (!email || !password) {
      setErrorStatus('দয়া করে ইমেইল ও পাসওয়ার্ড দুটিই ইনপুট করুন।');
      setLoading(false);
      return;
    }

    try {
      await onLogin(email, password);
    } catch (err: any) {
      setErrorStatus(err.message || 'ভুল ইমেইল অথবা পাসওয়ার্ড। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'employee') => {
    const targetEmail = role === 'admin' ? 'admin@inventory.com' : 'employee@inventory.com';
    setEmail(targetEmail);
    setPassword('password');
    setErrorStatus('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4" id="login_screen">
      {/* Decorative background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24mm_24mm] opacity-30 pointer-events-none"></div>

      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 border border-slate-100 flex flex-col justify-between">
        {/* Header Branding */}
        <div className="p-8 bg-slate-950 text-white text-center space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl"></div>
          <div className="p-3.5 bg-indigo-600 text-white rounded-2xl inline-block shadow-lg mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">ইনভেন্টরি স্মার্ট ড্যাশবোর্ড</h1>
            <p className="text-slate-400 text-xs mt-1">পূর্ণাঙ্গ রোল-বেসড এক্সেস কন্ট্রোল সিস্টেম</p>
          </div>
        </div>

        {/* Input credentials form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {errorStatus && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 leading-normal animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorStatus}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" /> ব্যবহারকারী ইমেইল (User Email)
            </label>
            <input
              type="email"
              required
              placeholder="admin@inventory.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-slate-700 text-xs font-bold mb-1.5 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-400" /> সিকিউর পাসওয়ার্ড (Password)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl bg-slate-50/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex justify-center items-center gap-1.5 cursor-pointer disabled:bg-indigo-400"
          >
            {loading ? 'প্রবেশ করা হচ্ছে...' : 'কন্ট্রোল প্যানেলে প্রবেশ করুন'}
          </button>
        </form>

        {/* Quick presets trigger boxes */}
        <div className="px-8 pb-8 border-t border-slate-55/80 bg-slate-50 p-6">
          <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase text-center mb-3">
            সহজে পরীক্ষা করুন (Quick Preset Logins)
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="p-2.5 bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 font-bold rounded-xl text-center cursor-pointer flex flex-col items-center gap-1 shadow-2xs transition"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>এডমিন সেশন (Admin)</span>
              <span className="text-[9px] text-slate-450 font-medium">admin@inventory.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('employee')}
              className="p-2.5 bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 font-bold rounded-xl text-center cursor-pointer flex flex-col items-center gap-1 shadow-2xs transition"
            >
              <User className="w-4 h-4 text-emerald-650" />
              <span>স্টাফ সেশন (Staff)</span>
              <span className="text-[9px] text-slate-450 font-medium font-medium">employee@inventory.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
