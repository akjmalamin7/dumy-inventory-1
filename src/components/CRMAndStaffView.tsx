import React, { useState } from 'react';
import { 
  Users, UserPlus, HeartHandshake, PhoneCall, Gift, Check, Coins, Plus, Calendar, CoinsIcon, Database, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';
import { Customer, Employee, SalaryPayment, Loan, User } from '../types.js';

interface CRMAndStaffViewProps {
  customers: Customer[];
  employees: Employee[];
  salaries: SalaryPayment[];
  loans: Loan[];
  activeUser: User;
  onAddCustomer: (customerData: { name: string; email: string; phone: string; address: string }) => Promise<any>;
  onAddEmployee: (empData: { name: string; email: string; phone: string; designation: string; salaryAmount: number }) => Promise<any>;
  onRecordSalary: (salaryData: { employeeId: string; month: string; amount: number }) => Promise<any>;
  onRecordLoan: (loanData: { employeeId: string; amount: number; type: 'disbursed' | 'repaid'; description: string }) => Promise<any>;
}

export default function CRMAndStaffView({
  customers, employees, salaries, loans, activeUser,
  onAddCustomer, onAddEmployee, onRecordSalary, onRecordLoan
}: CRMAndStaffViewProps) {
  const isAdmin = activeUser.role === 'admin';
  const [activeTab, setActiveTab] = useState<'crm' | 'staff' | 'loans'>('crm');

  // Customer Form states
  const [csName, setCsName] = useState('');
  const [csEmail, setCsEmail] = useState('');
  const [csPhone, setCsPhone] = useState('');
  const [csAddress, setCsAddress] = useState('');
  const [csSuccess, setCsSuccess] = useState('');

  // Employee Form states
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empDesignation, setEmpDesignation] = useState('');
  const [empSalary, setEmpSalary] = useState('25000');
  const [empSuccess, setEmpSuccess] = useState('');

  // Salary payment modal/form states
  const [payEmpId, setPayEmpId] = useState('');
  const [payMonth, setPayMonth] = useState('June 2026');
  const [payAmount, setPayAmount] = useState('');
  const [paySuccess, setPaySuccess] = useState('');

  // Loan form states
  const [loanEmpId, setLoanEmpId] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanType, setLoanType] = useState<'disbursed' | 'repaid'>('disbursed');
  const [loanDesc, setLoanDesc] = useState('');
  const [loanSuccess, setLoanSuccess] = useState('');

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCsSuccess('');
    if (!csName || !csPhone) return;

    try {
      await onAddCustomer({ name: csName, email: csEmail, phone: csPhone, address: csAddress });
      setCsSuccess('গ্রাহক সফলভাবে নিবন্ধিত হয়েছে!');
      setCsName('');
      setCsEmail('');
      setCsPhone('');
      setCsAddress('');
    } catch (err: any) {
      alert(err.message || 'গ্রাহক যোগ করতে ব্যহত হয়েছে');
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpSuccess('');
    if (!isAdmin) {
      alert('🔒 শুধুমাত্র এডমিনরা নতুন স্টাফ যোগ করতে পারেন।');
      return;
    }
    if (!empName || !empEmail || !empDesignation) return;

    try {
      await onAddEmployee({ 
        name: empName, 
        email: empEmail, 
        phone: empPhone, 
        designation: empDesignation, 
        salaryAmount: Number(empSalary) 
      });
      setEmpSuccess('কর্মচারী সফলভাবে তালিকাভুক্ত হয়েছে!');
      setEmpName('');
      setEmpEmail('');
      setEmpPhone('');
      setEmpDesignation('');
      setEmpSalary('25000');
    } catch (err: any) {
      alert(err.message || 'স্টাফ যোগ করতে সমস্যা হয়েছে');
    }
  };

  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaySuccess('');
    if (!payEmpId || !payMonth || !payAmount) return;

    try {
      await onRecordSalary({ 
        employeeId: payEmpId, 
        month: payMonth, 
        amount: Number(payAmount) 
      });
      setPaySuccess('বেতন প্রদান সফলভাবে রেকর্ড করা হয়েছে!');
      setPayAmount('');
    } catch (err: any) {
      alert(err.message || 'বেতন রেকর্ড করা যাচ্ছে না');
    }
  };

  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoanSuccess('');
    if (!loanEmpId || !loanAmount || !loanDesc) return;

    try {
      await onRecordLoan({
        employeeId: loanEmpId,
        amount: Number(loanAmount),
        type: loanType,
        description: loanDesc
      });
      setLoanSuccess('ঋণ এন্ট্রি সফলভাবে সম্পন্ন হয়েছে!');
      setLoanAmount('');
      setLoanDesc('');
    } catch (err: any) {
      alert(err.message || 'ঋণ এন্ট্রি রেকর্ড ব্যহত হয়েছে');
    }
  };

  // Helper: calculate employee dynamic net loan
  const getEmployeeLoanBalance = (empId: string) => {
    const disbursements = loans.filter(l => l.employeeId === empId && l.type === 'disbursed').reduce((s, l) => s + l.amount, 0);
    const repayments = loans.filter(l => l.employeeId === empId && l.type === 'repaid').reduce((s, l) => s + l.amount, 0);
    return disbursements - repayments;
  };

  return (
    <div className="space-y-6" id="crm_view">
      {/* Tab Selectors */}
      <div className="flex gap-2 border-b border-slate-100 pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('crm')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'crm' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          👤 কাস্টমার রিলেশনশিপ (CRM)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('staff')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'staff' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          👔 টিম স্টাফ ও স্যালারি বুক (HRM)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('loans')}
          className={`px-5 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
            activeTab === 'loans' 
              ? 'border-indigo-600 text-indigo-600' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          💰 স্টাফ অগ্রিম ও ঋণ খাতা (Loans)
        </button>
      </div>

      {activeTab === 'crm' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-25 duration-150">
          {/* Add Customer form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" /> নতুন গ্রাহক যোগ করুন
            </h3>

            <form onSubmit={handleCreateCustomer} className="space-y-4 pt-4">
              {csSuccess && (
                <div className="p-2 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-100">
                  {csSuccess}
                </div>
              )}

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">গ্রাহকের নাম (Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="গ্রাহকের সম্পূর্ণ নাম লিখুন"
                  value={csName}
                  onChange={(e) => setCsName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">ইমেইল ঠিকানা</label>
                <input
                  type="email"
                  placeholder="যেমনঃ customer@gmail.com"
                  value={csEmail}
                  onChange={(e) => setCsEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">মোবাইল নম্বর *</label>
                <input
                  type="text"
                  required
                  placeholder="মোবাইল নম্বর (১১ ডিজিট)"
                  value={csPhone}
                  onChange={(e) => setCsPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">ঠিকানা (Billing Address)</label>
                <textarea
                  placeholder="ঠিকানা এখানে লিখুন..."
                  value={csAddress}
                  onChange={(e) => setCsAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex justify-center items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> গ্রাহক রেজিস্টার করুন
              </button>
            </form>
          </div>

          {/* Customer list */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">পণ্য ক্রেতাদের বিবরণ তালিকা</h3>
              <p className="text-xs text-slate-500 mt-0.5">রিসেলার ও খুচরা ক্রেতাদের রেজিস্ট্রি ডিরেক্টরি</p>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold">
                  <tr>
                    <th className="p-4">গ্রাহক ক্যাটাগরি ও নাম</th>
                    <th className="p-4">যোগাযোগ</th>
                    <th className="p-4">ঠিকানা</th>
                    <th className="p-4">নিবন্ধনের তারিখ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {c.id}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800">{c.phone}</p>
                          <p className="text-[11px] text-slate-500">{c.email || 'কোনো ইমেইল নেই'}</p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-700 font-medium">
                        {c.address || 'বর্ণনা নেই'}
                      </td>
                      <td className="p-4 text-slate-500">
                        {new Date(c.createdAt).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                  {customers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-slate-400">কোনো গ্রাহক পাওয়া যায়নি।</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-25 duration-150">
          {/* Add Employee & Record salary box */}
          <div className="space-y-6">
            {/* Add Employee Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" /> নতুন স্টাফ কর্মকর্তা যোগ করুন
              </h3>

              <form onSubmit={handleCreateEmployee} className="space-y-3 pt-3">
                {empSuccess && (
                  <div className="p-2 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg">
                    {empSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 text-[10px] font-bold mb-1">স্টাফ কর্মকর্তার নাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="হুমায়ুন আহমেদ"
                    value={empName}
                    disabled={!isAdmin}
                    onChange={(e) => setEmpName(e.target.value)}
                    className="w-full px-3.5 py-1.5 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl disabled:bg-slate-150"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold mb-1">ইমেইল ঠিকানা *</label>
                    <input
                      type="email"
                      required
                      placeholder="humayun@co.com"
                      value={empEmail}
                      disabled={!isAdmin}
                      onChange={(e) => setEmpEmail(e.target.value)}
                      className="w-full px-3.5 py-1.5 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold mb-1">মোবাইল ফোন</label>
                    <input
                      type="text"
                      placeholder="017123..."
                      value={empPhone}
                      disabled={!isAdmin}
                      onChange={(e) => setEmpPhone(e.target.value)}
                      className="w-full px-3.5 py-1.5 text-xs border border-slate-200 focus:outline-none rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold mb-1">পদবী (Designation) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Sales Manager"
                      value={empDesignation}
                      disabled={!isAdmin}
                      onChange={(e) => setEmpDesignation(e.target.value)}
                      className="w-full px-3.5 py-1.5 text-xs border border-slate-200 focus:outline-none rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold mb-1">মাসিক মূল বেতন *</label>
                    <input
                      type="number"
                      required
                      placeholder="35000"
                      value={empSalary}
                      disabled={!isAdmin}
                      onChange={(e) => setEmpSalary(e.target.value)}
                      className="w-full px-3.5 py-1.5 text-xs border border-slate-200 focus:outline-none rounded-xl font-bold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isAdmin}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  স্টাফ এড করুন
                </button>
              </form>
            </div>

            {/* Pay Salary Box (Admin only) */}
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm">
              <h3 className="text-sm font-bold border-b border-slate-800 pb-3 flex items-center gap-2 text-indigo-300">
                <Calendar className="w-5 h-5" /> মাসিক বেতন পরিশোধ (Pay Salary)
              </h3>

              <form onSubmit={handlePaySalary} className="space-y-3 pt-3 text-slate-200">
                {paySuccess && (
                  <div className="p-2 bg-indigo-500/10 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-500/20">
                    {paySuccess}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold mb-1">কর্মচারী নির্বাচন *</label>
                  <select
                    required
                    value={payEmpId}
                    onChange={(e) => {
                      setPayEmpId(e.target.value);
                      const emp = employees.find(emp => emp.id === e.target.value);
                      if (emp) setPayAmount(String(emp.salaryAmount));
                    }}
                    className="w-full p-2 text-xs bg-slate-850 border border-slate-800 rounded-xl focus:outline-none text-slate-800"
                  >
                    <option value="">কর্মচারী সিলেক্ট করুন...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold mb-1">বেতন মাস *</label>
                    <input
                      type="text"
                      required
                      value={payMonth}
                      onChange={(e) => setPayMonth(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-850 border border-slate-800 rounded-xl text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1">পরিশোধের পরিমাণ *</label>
                    <input
                      type="number"
                      required
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-850 border border-slate-800 rounded-xl font-bold text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isAdmin}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:bg-slate-800 disabled:text-slate-500"
                >
                  বেতন পেইড করুন ৳
                </button>
              </form>
            </div>
          </div>

          {/* Employee database table & salary list */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">কর্মচারী ডিরেক্টরি ও পদবী তালিকা</h3>
                <p className="text-xs text-slate-500 mt-0.5">অফিস স্টাফদের ইনফরমেশন ও ডেটাবেজ রেকর্ড</p>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold">
                  <tr>
                    <th className="p-4">নাম ও আইডেন্টিটি</th>
                    <th className="p-4">যোগাযোগ</th>
                    <th className="p-4">মূল বেতন স্কেল</th>
                    <th className="p-4 text-right">বকেয়া ঋণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {employees.map((e) => {
                    const lBal = getEmployeeLoanBalance(e.id);
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{e.name}</p>
                            <span className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] rounded font-bold mt-1">
                              {e.designation}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-slate-800">{e.phone}</p>
                          <p className="text-[11px] text-slate-500">{e.email}</p>
                        </td>
                        <td className="p-4 font-bold text-slate-850">
                          ৳{e.salaryAmount.toLocaleString('en-IN')} / মাস
                        </td>
                        <td className="p-4 text-right text-amber-700 font-bold">
                          {lBal > 0 ? `৳${lBal.toLocaleString('en-IN')}` : '৳০'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Salary payment ledger logs */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">সাম্প্রতিক বেতন প্রদানের খতিয়ান (Salary History)</h4>
              <div className="space-y-2 pt-3 max-h-48 overflow-y-auto">
                {salaries.map((sal) => (
                  <div key={sal.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{sal.employeeName}</p>
                      <p className="text-[11px] text-slate-500">মাসঃ {sal.month} | তারিখঃ {new Date(sal.paymentDate).toLocaleDateString('en-GB')}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-emerald-600 font-mono">৳{sal.amount.toLocaleString('en-IN')} Paid</span>
                      <span className="block text-[10px] text-slate-400">রশিদ নং: {sal.id}</span>
                    </div>
                  </div>
                ))}
                {salaries.length === 0 && (
                  <p className="text-slate-400 text-xs text-center py-6">কোনো বেতন পরিষদের ইতিহাস নেই।</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-25 duration-150" id="loans_view">
          {/* Records advanced loan transaction (Disbursed/Repaid) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-amber-500" /> ঋণ বা কর্জে হাসানা খাতা
            </h3>

            <form onSubmit={handleSaveLoan} className="space-y-4 pt-4">
              {loanSuccess && (
                <div className="p-2 bg-indigo-50 text-indigo-800 text-xs font-semibold rounded-lg">
                  {loanSuccess}
                </div>
              )}

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">ঋণগ্রহীতা কর্মচারী *</label>
                <select
                  required
                  value={loanEmpId}
                  onChange={(e) => setLoanEmpId(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                >
                  <option value="">কর্মচারী নির্বাচন করুন...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name} (Designation: {e.designation})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">টাকার পরিমাণ (BDT) *</label>
                <input
                  type="number"
                  required
                  placeholder="যেমনঃ ১০০০০ Taka"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">লেনদেনের ধরণ *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLoanType('disbursed')}
                    className={`p-2 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1 cursor-pointer ${
                      loanType === 'disbursed' 
                        ? 'bg-amber-600 text-white border-amber-600' 
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> ঋণ প্রদান (Disbursed)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoanType('repaid')}
                    className={`p-2 text-xs font-bold rounded-xl border transition flex items-center justify-center gap-1 cursor-pointer ${
                      loanType === 'repaid' 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" /> ফেরত আদায় (Repaid)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">সংক্ষিপ্ত বিবরণ (Description) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মেয়ের বিয়ের অগ্রিম বেতন, বাইক লোন"
                  value={loanDesc}
                  onChange={(e) => setLoanDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                ঋণ ট্রানজেকশন রেকর্ড করুন
              </button>
            </form>
          </div>

          {/* Full loan history details ledger */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">অগ্রিম ও ঋণ হিসেবের খাতা (Staff Loan Ledger)</h3>
              <p className="text-xs text-slate-500 mt-0.5">সব ঋণ ট্রানজেকশনের সম্পূর্ণ বিবরণ ও লেনদেনের ইতিহাস</p>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold">
                  <tr>
                    <th className="p-4">গ্রাহক কর্মচারী</th>
                    <th className="p-4">তারিখ</th>
                    <th className="p-4">ধরণ (Type)</th>
                    <th className="p-4">টাকার পরিমাণ</th>
                    <th className="p-4 text-right">বিবরণ / কারণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <p className="font-bold text-slate-800">{loan.employeeName}</p>
                        <span className="text-[10px] text-slate-400">ID: {loan.id}</span>
                      </td>
                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(loan.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          loan.type === 'disbursed' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {loan.type === 'disbursed' ? 'ঋণ প্রদান' : 'ফেরত আদায়'}
                        </span>
                      </td>
                      <td className="p-4 font-extrabold text-slate-900 text-sm">
                        ৳{loan.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-right font-medium text-slate-750">
                        {loan.description}
                      </td>
                    </tr>
                  ))}
                  {loans.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">কোনো ঋণ রেকর্ড এবং অগ্রিম প্রদান বুকিং পাওয়া যায়নি।</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
