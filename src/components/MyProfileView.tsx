import React, { useState } from 'react';
import { 
  User as UserIcon, Shield, Mail, Phone, Calendar, Briefcase, Coins, Send, Check, X, 
  AlertCircle, RefreshCw, FileText, Landmark, Key, HeartHandshake, CheckCircle2, UserCheck
} from 'lucide-react';
import { User, Employee, SalaryPayment, Loan, AdvanceSalaryRequest } from '../types';

interface MyProfileViewProps {
  activeUser: User;
  employees: Employee[];
  salaries: SalaryPayment[];
  loans: Loan[];
  advanceRequests: AdvanceSalaryRequest[];
  onUpdateProfile: (payload: { name: string; email: string; phone: string; bio?: string }) => Promise<any>;
  onRequestAdvance: (payload: { amount: number; month: string; reason: string }) => Promise<any>;
  onApproveRejectAdvance: (id: string, status: 'approved' | 'rejected') => Promise<any>;
}

export default function MyProfileView({
  activeUser, employees, salaries, loans, advanceRequests,
  onUpdateProfile, onRequestAdvance, onApproveRejectAdvance
}: MyProfileViewProps) {
  const isAdmin = activeUser.role === 'admin';
  const matchingEmployeeObj = employees.find(e => e.email.toLowerCase() === activeUser.email.toLowerCase());

  // Edit fields state
  const [name, setName] = useState(activeUser.name);
  const [email, setEmail] = useState(activeUser.email);
  const [phone, setPhone] = useState(activeUser.phone || '');
  const [bio, setBio] = useState((activeUser as any).bio || '');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // New Request Form state
  const [advAmount, setAdvAmount] = useState('');
  const [advMonth, setAdvMonth] = useState('July 2026');
  const [advReason, setAdvReason] = useState('');
  const [reqSuccess, setReqSuccess] = useState('');
  const [reqLoading, setReqLoading] = useState(false);

  // Internal visual tabs inside profile view
  const [activeTab, setActiveTab] = useState<'profile' | 'advanced_salary' | 'loans_ledger'>('profile');

  // Handle profile edit submission
  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess('');
    setSaveLoading(true);

    try {
      await onUpdateProfile({ name, email, phone, bio });
      setSaveSuccess('আপনার প্রোফাইল সফলভাবে আপডেট করা হয়েছে!');
      setTimeout(() => setSaveSuccess(''), 5000);
    } catch (err: any) {
      alert(err.message || 'প্রোফাইল আপডেট করতে ব্যহত হয়েছে');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle advanced salary submit
  const handleRequestAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqSuccess('');
    if (!advAmount || !advMonth || !advReason) return;

    if (!matchingEmployeeObj && !isAdmin) {
      alert('🔒 শুধুমাত্র কোম্পানি স্টাফরাই অগ্রিম বেতনের আবেদন করতে পারেন।');
      return;
    }

    setReqLoading(true);
    try {
      await onRequestAdvance({
        amount: Number(advAmount),
        month: advMonth,
        reason: advReason
      });
      setReqSuccess('আপনার অগ্রিম বেতনের আবেদনটি এডমিনদের কাছে পাঠানো হয়েছে!');
      setAdvAmount('');
      setAdvReason('');
      setTimeout(() => setReqSuccess(''), 5000);
    } catch (err: any) {
      alert(err.message || 'অগ্রিম বেতনের আবেদন করতে সমস্যা হয়েছে');
    } finally {
      setReqLoading(false);
    }
  };

  // Helper values
  // Calculate employee dynamic net loan/advances
  const getEmployeeLoanAndAdvanceStats = () => {
    if (!matchingEmployeeObj) return { disbursed: 0, repaid: 0, balance: 0 };
    const empId = matchingEmployeeObj.id;
    const disbursed = loans.filter(l => l.employeeId === empId && l.type === 'disbursed').reduce((s, l) => s + l.amount, 0);
    const repaid = loans.filter(l => l.employeeId === empId && l.type === 'repaid').reduce((s, l) => s + l.amount, 0);
    return {
      disbursed,
      repaid,
      balance: disbursed - repaid
    };
  };

  const { disbursed, repaid, balance } = getEmployeeLoanAndAdvanceStats();

  const mySalaries = matchingEmployeeObj 
    ? salaries.filter(s => s.employeeId === matchingEmployeeObj.id)
    : [];

  const myLoans = matchingEmployeeObj
    ? loans.filter(l => l.employeeId === matchingEmployeeObj.id)
    : [];

  const myAdvanceRequests = matchingEmployeeObj
    ? advanceRequests.filter(req => req.employeeId === matchingEmployeeObj.id)
    : [];

  return (
    <div className="space-y-6 animate-in fade-in-25 duration-150" id="profile_root_view">
      {/* Visual Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-4 rounded-2xl text-white ${isAdmin ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
            <UserIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {activeUser.name} - এর প্রোফাইল ও ড্যাশবোর্ড
            </h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> রোলঃ <span className="font-bold text-slate-700 uppercase">{activeUser.role}</span> | অ্যাকাউন্ট আইডিঃ <span className="font-mono text-slate-600">{activeUser.id}</span>
            </p>
          </div>
        </div>

        {/* Dynamic Badge for limits */}
        {!isAdmin && matchingEmployeeObj && (
          <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl flex items-center gap-3">
            <Coins className="w-5 h-5 text-amber-500 animate-pulse" />
            <div className="text-xs">
              <span className="block text-slate-400 font-medium">মাসিক মূল বেতনঃ</span>
              <span className="font-extrabold text-white text-sm">৳{matchingEmployeeObj.salaryAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Internal Tabs Navigator */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'profile' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserIcon className="w-4 h-4" /> প্রোফাইল তথ্য পরিবর্তন
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('advanced_salary')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'advanced_salary' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-4 h-4" /> 
          {isAdmin ? 'অগ্রিম বেতনের আবেদনসমূহ' : 'অগ্রিম বেতন আবেদন (Advance Request)'}
          {isAdmin && advanceRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[9px]">
              {advanceRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>

        {!isAdmin && matchingEmployeeObj && (
          <button
            type="button"
            onClick={() => setActiveTab('loans_ledger')}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'loans_ledger' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Landmark className="w-4 h-4" /> ব্যক্তিগত ঋণ ও বেতনের রেকর্ড
          </button>
        )}
      </div>

      {/* Profile Details and Actions Tab */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-20 duration-150">
          {/* User Details Form Card */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-850 border-b border-line pb-3.5 mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-600" /> প্রোফাইল আইডেন্টিটি আপডেট করুন
            </h3>

            <form onSubmit={handleProfileUpdateSubmit} className="space-y-4">
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1">ব্যবহারকারীর নাম (Full Name) *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1">ইমেইল ঠিকানা (Email) *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1">মোবাইল ফোন ও যোগাযোগ নম্বর</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1">অ্যাকাউন্ট রোল</label>
                  <input
                    type="text"
                    disabled
                    value={activeUser.role === 'admin' ? 'কোম্পানি এডমিনিস্ট্রেটর' : 'অগ্রিম স্টাফ একাউন্ট'}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">ব্যক্তিগত সংক্ষিপ্ত বায়ো (Bio / Short Notes)</label>
                <textarea
                  value={bio}
                  placeholder="আপনার কাজের ক্ষেত্র বা ব্যক্তিগত কাজের ডেসক্রিপশন লিখুন..."
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" /> {saveLoading ? 'সংরক্ষণ করা হচ্ছে...' : 'প্রোফাইল তথ্য সংরক্ষণ করুন'}
              </button>
            </form>
          </div>

          {/* Quick Guide/Info Box */}
          <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-indigo-300 border-b border-slate-800 pb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" /> রোল-বেসড এক্সেস এক নজরে
              </h3>

              <div className="space-y-4 pt-4 text-xs select-none">
                <div className="flex gap-2.5">
                  <div className="p-1 bg-indigo-500/10 rounded-lg text-indigo-400 font-bold shrink-0 self-start">✓</div>
                  <div>
                    <p className="font-bold text-white">কোম্পানি তথ্য নিয়ন্ত্রকঃ</p>
                    <p className="text-slate-450 text-[11px] mt-0.5 leading-normal">এডমিনরা যেকোনো ডেটা ডিলিট, স্যালারি পেমেন্ট এবং স্টাফ রেকর্ড ডিরেক্টরি ক্রিয়েট করতে পারেন।</p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <div className="p-1 bg-emerald-500/10 rounded-lg text-emerald-400 font-bold shrink-0 self-start">✓</div>
                  <div>
                    <p className="font-bold text-white">সেলস এন্ড অপারেশনস অ্যাক্সেসঃ</p>
                    <p className="text-slate-450 text-[11px] mt-0.5 leading-normal">কোম্পানি স্টাফরা পণ্য স্টক আপ করতে পারেন, নতুন সেলস অর্ডার এন্ড ইনভয়েস করতে পারেন, তবে স্টাফদের বেতন ডিক্লেয়ার বা ঋণ দিতে পারেন না।</p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <div className="p-1 bg-amber-500/10 rounded-lg text-amber-400 font-bold shrink-0 self-start">✓</div>
                  <div>
                    <p className="font-bold text-white">অগ্রিম বেতন ও ঋণ সুবিধাঃ</p>
                    <p className="text-slate-450 text-[11px] mt-0.5 leading-normal">স্টাফরা সরাসরি পোর্টাল ড্যাশবোর্ড থেকে অগ্রিম বেতনের আবেদন লিখে পাঠাতে পারেন এবং তাদের মাসিক ঋণের খতিয়ান পর্যবেক্ষণ করতে পারেন।</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-800 pt-4 text-[11px] text-slate-400 flex items-center gap-1.5 font-bold">
              <UserCheck className="w-4 h-4 text-emerald-500" /> 
              সিস্টেম সেশনঃ সচল (Session Alive)
            </div>
          </div>
        </div>
      )}

      {/* Advanced Salary requests / management tab */}
      {activeTab === 'advanced_salary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-20 duration-150">
          
          {/* Employee Request Form Box (Shown to employees OR admins if they want to create reference) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm self-start">
            <h3 className="text-sm font-bold text-slate-800 border-b border-light pb-3 mb-4 flex items-center gap-1.5">
              <Coins className="w-5 h-5 text-amber-500" /> নতুন অগ্রিম বেতন আবেদন
            </h3>

            {!isAdmin && !matchingEmployeeObj ? (
              <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-800">
                ⚠️ সিস্টেমে আপনার ইমেইলটি টিম স্টাফ হিসেবে রেজিস্টার করা নেই। আবেদন করতে দয়া করে এডমিনকে আপনার ইমেইল দিয়ে স্টাফ প্রোফাইল খুলতে বলুন।
              </div>
            ) : (
              <form onSubmit={handleRequestAdvanceSubmit} className="space-y-4">
                {reqSuccess && (
                  <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-100">
                    {reqSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1">আবেদনকারী স্টাফ</label>
                  <input
                    type="text"
                    disabled
                    value={isAdmin ? 'এডমিন (অফিসিয়াল এন্ট্রি)' : `${activeUser.name} (${matchingEmployeeObj?.designation})`}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1">অগ্রিম পরিশোধের পরিমাণ (BDT) *</label>
                  <input
                    type="number"
                    required
                    placeholder="যেমনঃ ১০০০"
                    value={advAmount}
                    onChange={(e) => setAdvAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl font-bold"
                  />
                  {matchingEmployeeObj && (
                    <span className="text-[10px] text-slate-500 block mt-1 font-semibold">
                      সর্বোচ্চ অনুমোদিত সীমা: ৳{Math.floor(matchingEmployeeObj.salaryAmount * 0.7)} (বেতনের সর্বোচ্চ ৭০%)
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1">কোন মাসের বেতনের বিপরীতে অগ্রিম? *</label>
                  <select
                    value={advMonth}
                    onChange={(e) => setAdvMonth(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl font-bold"
                  >
                    <option value="June 2026">June 2026</option>
                    <option value="July 2026">July 2026</option>
                    <option value="August 2026">August 2026</option>
                    <option value="September 2026">September 2026</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1">অগ্রিম টাকা নেয়ার কারণ *</label>
                  <textarea
                    required
                    placeholder="মেডিকেল ট্রিপ, বাসা ভাড়া, ইত্যাদি সংক্ষিপ্ত বিবরণ লিখুন..."
                    value={advReason}
                    onChange={(e) => setAdvReason(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reqLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  {reqLoading ? 'আবেদন পাঠানো হচ্ছে...' : 'অগ্রিম বেতনের রিকোয়েস্ট পাঠান'}
                </button>
              </form>
            )}
          </div>

          {/* List of Advance Request logs (Admins see all, Employees see their own) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">
                {isAdmin ? 'কোম্পানি অগ্রিম বেতন খাতা (Admin Controller)' : 'আমার অগ্রিম বেতন আবেদনের তালিকা (My Application Logs)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin ? 'সব কর্মচারীর বেতন অগ্রিম রিকোয়েস্ট পর্যবেক্ষণ এবং অনুমোদন করার ড্যাশবোর্ড' : 'আপনার প্রেরিত সকল অগ্রিম বেতন আবেদনসমূহের স্থিতি বিবরণ'}
              </p>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold">
                  <tr>
                    <th className="p-4">আবেদনকারী ও মাস</th>
                    <th className="p-4">তারিখ</th>
                    <th className="p-4">টাকার পরিমাণ</th>
                    <th className="p-4">আবেদনের কারণ</th>
                    <th className="p-4 text-center">স্ট্যাটাস ও অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(isAdmin ? advanceRequests : myAdvanceRequests).map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{req.employeeName}</p>
                          <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-bold mt-1">
                            বেতন মাসঃ {req.month}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-500 font-medium font-mono">
                        {req.requestDate}
                      </td>
                      <td className="p-4 font-extrabold text-slate-900 text-sm">
                        ৳{req.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 font-medium text-slate-700 max-w-[180px] break-keep">
                        {req.reason}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1.5 font-bold">
                          {req.status === 'pending' ? (
                            isAdmin ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`${req.employeeName}-এর অগ্রিম বেতনের আবেদনটি অনুমোদন করতে চান? এটি ক্যাশ বুক এবং লোন অ্যাকাউন্টে ডিসবার্সড হিসেবে রেকর্ড হবে।`)) {
                                      try {
                                        await onApproveRejectAdvance(req.id, 'approved');
                                      } catch (err: any) {
                                        alert(err.message || 'Error updating status');
                                      }
                                    }
                                  }}
                                  className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] cursor-pointer flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" /> গ্রহণ করুন
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm('নিশ্চিতভাবে এই অগ্রিম বেতনের আবেদনটি বাতিল করতে চান?')) {
                                      try {
                                        await onApproveRejectAdvance(req.id, 'rejected');
                                      } catch (err: any) {
                                        alert(err.message || 'Error updating status');
                                      }
                                    }
                                  }}
                                  className="p-1 px-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] cursor-pointer flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" /> নাকচ করুন
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800">
                                ⏳ রিভিউ করা হচ্ছে
                              </span>
                            )
                          ) : req.status === 'approved' ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3" /> পরিশোধিত (Approved)
                              </span>
                              {req.actionDate && (
                                <span className="text-[9px] text-slate-400 block font-mono font-medium">তারিখঃ {req.actionDate}</span>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] bg-red-100 text-red-850">
                                <X className="w-3 h-3" /> বাতিলকৃত (Rejected)
                              </span>
                              {req.actionDate && (
                                <span className="text-[9px] text-slate-400 block font-mono font-medium">তারিখঃ {req.actionDate}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(isAdmin ? advanceRequests : myAdvanceRequests).length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-20 text-slate-400">কোনো অগ্রিম বেতনের আবেদন বা হিস্ট্রি পাওয়া যায়নি।</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Employee Personal financial logs & history tab (Only shown for employees) */}
      {activeTab === 'loans_ledger' && !isAdmin && matchingEmployeeObj && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-20 duration-150" id="personal_financial_tab">
          
          {/* Summary Box stats */}
          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm">
              <h4 className="text-sm font-bold text-indigo-300 border-b border-slate-800 pb-3 block">আমার ঋণ হিসেব (Loan summary)</h4>
              
              <div className="space-y-4 pt-4 text-xs font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400">মোট অগ্রিম বা ঋণ নেয়া হয়েছেঃ</span>
                  <span className="text-amber-500 font-extrabold text-sm font-mono">৳{disbursed.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">মোট কিস্তি পরিশোধ করেছেনঃ</span>
                  <span className="text-emerald-400 font-extrabold text-sm font-mono">৳{repaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="border-t border-slate-800 pt-3.5 flex justify-between">
                  <span className="text-white text-sm">অবশিষ্ট বকেয়া দেনা (Balance)</span>
                  <span className={`text-base font-extrabold font-mono ${balance > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                    ৳{balance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* General advice */}
            <div className="bg-amber-55/15 p-4 rounded-2xl border border-amber-50 rounded-xl text-xs leading-normal font-medium text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                অগ্রিম বেতন বা ঋণ সমন্বয় আপনার পরবর্তী মাসের নিয়মিত বেতন প্রদান কালীন সময়ে স্বয়ংক্রিয়ভাবে নিয়মিত সমন্বয় হবে, অথবা অফিসে সরাসরি কিস্তির ক্যাশ জমা দিয়ে রশিদ সংগ্রহ করুন।
              </div>
            </div>
          </div>

          {/* History ledger boxes */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Realtime loans statement */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-slate-800 border-b border-light pb-3">ঋণ খতিয়ানের লেজার (Advance & Loans History)</h4>
              
              <div className="space-y-2 pt-3 max-h-48 overflow-y-auto">
                {myLoans.map(loan => (
                  <div key={loan.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        loan.type === 'disbursed' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      } mb-1.5`}>
                        {loan.type === 'disbursed' ? 'ঋণ প্রদান / অগ্রিম গ্রহণ' : 'কিস্তি আদায় করা হয়েছে'}
                      </span>
                      <p className="font-bold text-slate-800 leading-normal">{loan.description}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{loan.date}</p>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`text-sm font-extrabold ${loan.type === 'disbursed' ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {loan.type === 'disbursed' ? `+ ৳${loan.amount.toLocaleString('en-IN')}` : `- ৳${loan.amount.toLocaleString('en-IN')}`}
                      </span>
                    </div>
                  </div>
                ))}
                {myLoans.length === 0 && (
                  <p className="text-slate-400 text-xs text-center py-6">আপনার কোনো ঋণ ইতিহাস নেই।</p>
                )}
              </div>
            </div>

            {/* Realtime salary payout ledger */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-slate-800 border-b border-light pb-3">প্রাপ্ত বেতন রসিদ ও হিস্ট্রি (My Regular Paid Salaries)</h4>
              
              <div className="space-y-2 pt-3 max-h-48 overflow-y-auto">
                {mySalaries.map(sal => (
                  <div key={sal.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs animate-in slide-in-from-bottom-2">
                    <div>
                      <p className="font-bold text-slate-800">বেতন মাসঃ {sal.month}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-normal flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> পরিশোধের তথ্যঃ {new Date(sal.paymentDate).toLocaleString('en-GB')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-600 font-extrabold text-xs font-mono">৳{sal.amount.toLocaleString('en-IN')} Paid</span>
                      <span className="block text-[9px] text-slate-400 font-mono">রসিদ আইডিঃ {sal.id}</span>
                    </div>
                  </div>
                ))}
                {mySalaries.length === 0 && (
                  <p className="text-slate-400 text-xs text-center py-6">আপনার কোনো পূর্ববর্তী নিয়মিত বেতন পরিশোধের রসিদ পাওয়া যায়নি।</p>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
