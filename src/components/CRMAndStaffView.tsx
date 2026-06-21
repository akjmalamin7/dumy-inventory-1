import React, { useState } from 'react';
import { 
  Users, UserPlus, HeartHandshake, PhoneCall, Gift, Check, Coins, Plus, Calendar, CoinsIcon, Database, ArrowUpRight, ArrowDownLeft,
  Shield, Lock, CheckSquare, Square, ShieldAlert, Send
} from 'lucide-react';
import { Customer, Employee, SalaryPayment, Loan, User } from '../types.js';

interface CRMAndStaffViewProps {
  customers: Customer[];
  employees: Employee[];
  salaries: SalaryPayment[];
  loans: Loan[];
  activeUser: User;
  users?: User[];
  onAddCustomer: (customerData: { name: string; email: string; phone: string; address: string }) => Promise<any>;
  onAddEmployee: (empData: { name: string; email: string; phone: string; designation: string; salaryAmount: number }) => Promise<any>;
  onRecordSalary: (salaryData: { employeeId: string; month: string; amount: number }) => Promise<any>;
  onRecordLoan: (loanData: { employeeId: string; amount: number; type: 'disbursed' | 'repaid'; description: string }) => Promise<any>;
  onAddUser?: (payload: any) => Promise<any>;
  onUpdateUserAdmin?: (id: string, payload: any) => Promise<any>;
}

export default function CRMAndStaffView({
  customers, employees, salaries, loans, activeUser, users = [],
  onAddCustomer, onAddEmployee, onRecordSalary, onRecordLoan, onAddUser, onUpdateUserAdmin
}: CRMAndStaffViewProps) {
  const isAdmin = activeUser.role === 'admin' || activeUser.role === 'supper_admin';
  const isSuperAdmin = activeUser.role === 'supper_admin';
  const [activeTab, setActiveTab] = useState<'crm' | 'staff' | 'loans' | 'users'>('crm');

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

  // User tab form states
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uRole, setURole] = useState<'admin' | 'employee'>('employee');
  const [uPhone, setUPhone] = useState('');
  const [uDesignation, setUDesignation] = useState('');
  const [uMenus, setUMenus] = useState<string[]>(['dashboard', 'orders', 'profile']);
  const [userSuccess, setUserSuccess] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Brand-New SMS Portal States
  const [smsTargetGroup, setSmsTargetGroup] = useState<'customer' | 'employee'>('customer');
  const [smsRecipientType, setSmsRecipientType] = useState<'all' | 'individual'>('all');
  const [smsIndividualId, setSmsIndividualId] = useState('');
  const [smsText, setSmsText] = useState('');
  const [smsLogs, setSmsLogs] = useState<Array<{ id: string; to: string; message: string; timestamp: string; status: string }>>([
    { id: 'SMS-1', to: 'সকল সাধারণ গ্রাহকবৃন্দ (Bulk Event)', message: 'আমাদের নতুন পণ্য কালেকশনে ১৫% বিশেষ ছাড় চলছে! এখনই ভিজিট করুন।', timestamp: '2026-06-20T11:42:00Z', status: 'delivered' },
    { id: 'SMS-2', to: 'Employee Staff (+8801700000002)', message: 'আপনার মে মাসের মাসিক প্রোগ্রেস ও সেলিং বোনাস সফলভাবে এপ্রুভ হয়েছে।', timestamp: '2026-06-21T09:12:00Z', status: 'delivered' }
  ]);
  const [sendingSms, setSendingSms] = useState(false);

  const handleSendSmsTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsText.trim()) {
      alert('অনুগ্রহ করে বার্তার টেক্সট এখানে লিখুন।');
      return;
    }

    setSendingSms(true);
    setTimeout(() => {
      let recipientLabel = '';
      let numbersCount = 0;

      if (smsTargetGroup === 'customer') {
        numbersCount = customers.length;
        if (smsRecipientType === 'all') {
          recipientLabel = `সকল নিবন্ধিত গ্রাহকবৃন্দ (${numbersCount} জন Bulk)`;
        } else {
          const foundCust = customers.find(c => c.id === smsIndividualId);
          if (foundCust) {
            recipientLabel = `${foundCust.name} (${foundCust.phone})`;
          } else {
            recipientLabel = `অন্যান্য গ্রাহক / (+8801...)`;
          }
        }
      } else {
        numbersCount = employees.length;
        if (smsRecipientType === 'all') {
          recipientLabel = `সকল টিম স্টাফ ও কর্মচারী (${numbersCount} জন Bulk)`;
        } else {
          const foundEmp = employees.find(emp => emp.id === smsIndividualId);
          if (foundEmp) {
            recipientLabel = `স্টাফঃ ${foundEmp.name} (${foundEmp.phone})`;
          } else {
            recipientLabel = `স্টাফ কর্মচারী / (+8801...)`;
          }
        }
      }

      const newLog = {
        id: `SMS-${Date.now()}`,
        to: recipientLabel,
        message: smsText,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      };

      setSmsLogs(prev => [newLog, ...prev]);
      setSmsText('');
      setSendingSms(false);
      alert(`✅ গেটওয়ে রিপোর্টঃ সফলভাবে ${smsRecipientType === 'all' ? `সকল (${numbersCount} জন)` : '১ জন'} ${smsTargetGroup === 'customer' ? 'গ্রাহককে' : 'কর্মচারীকে'} SMS পাঠানো হয়েছে!\n\nপ্রাপকঃ ${recipientLabel}\nবার্তাঃ "${smsText}"`);
    }, 1000);
  };

  const handleCreateAppUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserSuccess('');
    if (!onAddUser) return;
    if (!uName || !uEmail || !uRole) {
      alert('অনুগ্রহ করে নাম, ইমেইল এবং রোল প্রদান করুন।');
      return;
    }

    setIsSubmittingUser(true);
    try {
      await onAddUser({
        name: uName,
        email: uEmail,
        role: uRole,
        phone: uPhone,
        designation: uDesignation,
        allowedMenus: uMenus
      });
      setUserSuccess('ইউজার অ্যাকাউন্টটি সফলভাবে খোলা হয়েছে! (পাসওয়ার্ড ডিফল্টঃ password)');
      setUName('');
      setUEmail('');
      setUPhone('');
      setUDesignation('');
      setURole('employee');
      setUMenus(['dashboard', 'orders', 'profile']);
    } catch (err: any) {
      alert(err.message || 'ইউজার রেজিস্টার করতে ব্যর্থ হয়েছে');
    } finally {
      setIsSubmittingUser(false);
    }
  };

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
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-5 py-3 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'users' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-indigo-800 font-bold'
            }`}
          >
            🔐 ব্যবহারকারী ও পারমিশন কন্ট্রোল (RBAC & Permissions)
          </button>
        )}
      </div>

      {activeTab === 'crm' && (
        <div className="space-y-6 animate-in fade-in-25 duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          {/* SMS Marketing Portal & Communication Panel */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl" id="sms_portal_widget">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-base font-black flex items-center gap-2 text-indigo-400">
                  <PhoneCall className="w-5 h-5 animate-pulse" /> গ্রাহক ও টিম SMS বডকাস্টিং পোর্টাল (SMS Gateway Simulator)
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  এখানে সকল খদ্দের অথবা কর্মকর্তাদের নাম্বারে রিয়েল-টাইম অফার বা নোটিফিকেশন বার্তা পাঠান।
                </p>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-emerald-500/20 tracking-wider">
                ● SMS গেটওয়েঃ সচল
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form configure */}
              <div className="lg:col-span-5 bg-slate-950/40 p-5 rounded-2xl border border-slate-850">
                <form onSubmit={handleSendSmsTrigger} className="space-y-4">
                  <div>
                    <label className="block text-slate-350 text-xs font-bold mb-1.5">১. টার্গেট অডিয়েন্স (Target Audience Group)</label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSmsTargetGroup('customer');
                          setSmsIndividualId('');
                        }}
                        className={`py-2 text-[11px] font-black rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          smsTargetGroup === 'customer' 
                            ? 'bg-indigo-650 text-white border-indigo-605 shadow-md shadow-indigo-650/20' 
                            : 'bg-slate-900 text-slate-400 border-slate-850 hover:bg-slate-805'
                        }`}
                      >
                        👥 গ্রাহক খাতা (Customers)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSmsTargetGroup('employee');
                          setSmsIndividualId('');
                        }}
                        className={`py-2 text-[11px] font-black rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          smsTargetGroup === 'employee' 
                            ? 'bg-indigo-650 text-white border-indigo-600 shadow-md shadow-indigo-650/20' 
                            : 'bg-slate-900 text-slate-400 border-slate-850 hover:bg-slate-805'
                        }`}
                      >
                        🕴️ স্টাফ ও টিম (Employees)
                      </button>
                    </div>

                    <label className="block text-slate-350 text-xs font-bold mb-1.5">২. প্রাপক পরিসর (Recipient Filter)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSmsRecipientType('all')}
                        className={`py-2 text-xs font-extrabold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          smsRecipientType === 'all' 
                            ? 'bg-indigo-650 text-white border-indigo-600 shadow-md' 
                            : 'bg-slate-900 text-slate-400 border-slate-850 hover:bg-slate-800'
                        }`}
                      >
                        {smsTargetGroup === 'customer' ? `সকল গ্রাহক (${customers.length})` : `সকল কর্মী (${employees.length})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSmsRecipientType('individual')}
                        className={`py-2 text-xs font-extrabold rounded-xl border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                          smsRecipientType === 'individual' 
                            ? 'bg-indigo-650 text-white border-indigo-600 shadow-md' 
                            : 'bg-slate-900 text-slate-400 border-slate-850 hover:bg-slate-800'
                        }`}
                      >
                        {smsTargetGroup === 'customer' ? 'একজন গ্রাহক' : 'একজন স্টাফ'}
                      </button>
                    </div>
                  </div>

                  {smsRecipientType === 'individual' && (
                    <div className="animate-in slide-in-from-top-1.5 duration-150">
                      <label className="block text-slate-300 text-[11px] mb-1 font-semibold">
                        {smsTargetGroup === 'customer' ? 'গ্রাহকের নাম ও ফোন নম্বর নির্বাচন করুনঃ' : 'কর্মচারীর নাম ও ফোন নম্বর নির্বাচন করুনঃ'}
                      </label>
                      <select
                        required
                        value={smsIndividualId}
                        onChange={(e) => setSmsIndividualId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-200 px-3 py-2 text-xs rounded-xl text-white"
                      >
                        <option value="" className="text-slate-400 bg-slate-900">
                          {smsTargetGroup === 'customer' ? 'গ্রাহক সিলেক্ট করুন...' : 'কর্মচারী সিলেক্ট করুন...'}
                        </option>
                        {smsTargetGroup === 'customer' 
                          ? customers.map(c => (
                              <option key={c.id} value={c.id} className="text-white bg-slate-900">
                                {c.name} - ({c.phone})
                              </option>
                            ))
                          : employees.map(emp => (
                              <option key={emp.id} value={emp.id} className="text-white bg-slate-900">
                                {emp.name} - ({emp.phone}) [{emp.designation}]
                              </option>
                            ))
                        }
                      </select>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-slate-350 text-xs font-bold">২. বার্তার বিবরণ (SMS Content Text)</label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {smsText.length} / ১৬০ অক্ষর ({Math.ceil(smsText.length / 160)} SMS)
                      </span>
                    </div>
                    <textarea
                      required
                      rows={4}
                      value={smsText}
                      onChange={(e) => setSmsText(e.target.value)}
                      placeholder="বাংলা অথবা ইংরেজিতে আপনার বার্তাটি লিখুন। যেমন: স্টক শেষ হওয়ার আগেই অর্ডার দিয়ে আপনার কপি সংগ্রহ করুন!"
                      className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sendingSms}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition shadow-lg shadow-indigo-650/10"
                  >
                    {sendingSms ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        অনলাইনে প্রেরণ করা হচ্ছে...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> গেটওয়ে দিয়ে এখনই SMS পাঠান
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Transmission logs list */}
              <div className="lg:col-span-7 bg-slate-950/30 p-5 rounded-2xl border border-slate-850 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest border-b border-slate-850 pb-2 mb-3">
                    📜 SMS প্রেরণের লাইভ লক ও ইতিহাস (Transmitted logs)
                  </h4>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {smsLogs.map(log => (
                      <div key={log.id} className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex flex-col md:flex-row justify-between gap-1.5 text-xs">
                        <div className="space-y-1">
                          <div className="flex gap-1.5 items-center flex-wrap">
                            <span className="bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">
                              {log.id}
                            </span>
                            <span className="font-bold text-slate-200">
                              To: {log.to}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] leading-relaxed">
                            "{log.message}"
                          </p>
                        </div>

                        <div className="text-right shrink-0 self-start md:self-center">
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold">
                            ✔ Sent
                          </span>
                          <span className="block text-[9px] text-slate-500 font-mono mt-1">
                            {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-850 text-[10px] text-slate-500 flex justify-between items-center font-semibold">
                  <span>মোট প্রেরিত মেসেজঃ {smsLogs.length} টি</span>
                  <span>দৈনিক টেলিকম লিমিটঃ ১,০০০ SMS বাকি</span>
                </div>
              </div>
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

      {activeTab === 'users' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-25 duration-150" id="users_permissions_view">
          {/* Add User Section */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm self-start">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" /> নতুন ইউজার অ্যাকাউন্ট খুলুন
            </h3>

            <form onSubmit={handleCreateAppUser} className="space-y-4 pt-4">
              {userSuccess && (
                <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-100 animate-pulse">
                  {userSuccess}
                </div>
              )}

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">ব্যবহারকারীর নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমনঃ শামীম হাসান"
                  value={uName}
                  onChange={(e) => setUName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">ইমেইল এড্রেস *</label>
                <input
                  type="email"
                  required
                  placeholder="username@inventory.com"
                  value={uEmail}
                  onChange={(e) => setUEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold mb-1">মোবাইল নম্বর</label>
                  <input
                    type="text"
                    placeholder="01912345678"
                    value={uPhone}
                    onChange={(e) => setUPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-505 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-[10px] font-bold mb-1">পদবী (Designation)</label>
                  <input
                    type="text"
                    placeholder="Sales Executive"
                    value={uDesignation}
                    onChange={(e) => setUDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">পোর্টাল রোল (Access Role) *</label>
                <select
                  required
                  value={uRole}
                  onChange={(e) => setURole(e.target.value as any)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl font-bold"
                >
                  <option value="employee">Employee (স্টাফ কর্মচারী)</option>
                  {isSuperAdmin && <option value="admin">Admin (এডমিন কর্মকর্তা)</option>}
                </select>
                {!isSuperAdmin && (
                  <span className="block text-[10px] text-amber-600 mt-1.5 font-semibold leading-relaxed">
                    🔒 সেশন রেস্ট্রিকশনঃ শুধুমাত্র সুপার অ্যাডমিনরাই নতুন অ্যাডমিন অ্যাকাউন্ট খুলতে পারেন।
                  </span>
                )}
              </div>

              <div>
                <label className="block text-slate-700 text-xs font-semibold mb-1">ডিফল্ট মেনু দেখানোর অনুমতি (Menu Permissions)</label>
                <div className="grid grid-cols-2 gap-2 pt-1 border border-slate-100 p-2 rounded-xl bg-slate-50/50">
                  {[
                    { id: 'dashboard', label: '📊 ড্যাশবোর্ড' },
                    { id: 'products', label: '📦 পণ্য স্টক' },
                    { id: 'categories', label: '🏷️ ক্যাটাগরি' },
                    { id: 'orders', label: '🛒 বিক্রয়/রশিদ' },
                    { id: 'crm', label: '👥 কাস্টমার/স্টাফ' },
                    { id: 'reports', label: '📈 সেলস রিপোর্ট' },
                    { id: 'alerts', label: '🔔 মেইল অবশেষ' },
                    { id: 'profile', label: '👤 প্রোফাইল' }
                  ].map(menu => {
                    const isChecked = uMenus.includes(menu.id);
                    return (
                      <button
                        key={menu.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setUMenus(prev => prev.filter(m => m !== menu.id));
                          } else {
                            setUMenus(prev => [...prev, menu.id]);
                          }
                        }}
                        className="flex items-center gap-1.5 p-1.5 text-left text-[10px] font-bold hover:bg-white rounded-lg transition"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-350" />
                        )}
                        <span className={isChecked ? 'text-indigo-950 text-xs' : 'text-slate-500 text-xs'}>{menu.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingUser}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmittingUser ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : 'ইউজার ক্রিয়েট করুন'}
              </button>
            </form>
          </div>

          {/* User Directory & Allowed Menus grid */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">সিস্টেম ব্যবহারকারী ও মেনু অ্যাক্সেস খাতা</h3>
                <p className="text-xs text-slate-500 mt-0.5">রোল-ভিত্তিক ইউজার তালিকা, মেনু পারমিশন এবং অ্যাকাউন্ট ব্লক/আনব্লক করার প্যানেল</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100">
                    <tr>
                      <th className="p-4">ইউজার ও রোল</th>
                      <th className="p-4">পারমিশন মেনু (Allowed Menus)</th>
                      <th className="p-4 text-center">স্ট্যাটাস</th>
                      <th className="p-4 text-right">পদক্ষেপ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {users.map((u) => {
                      const canManageUser = isSuperAdmin ? (u.id !== activeUser.id) : (u.role === 'employee');
                      const activeMenus = u.allowedMenus || (
                        u.role === 'employee' 
                          ? ['dashboard', 'orders', 'profile'] 
                          : ['dashboard', 'products', 'categories', 'orders', 'crm', 'reports', 'alerts', 'profile']
                      );

                      const handleToggleMenu = async (menuId: string) => {
                        if (!canManageUser || !onUpdateUserAdmin) return;
                        const hasMenu = activeMenus.includes(menuId);
                        const updatedMenus = hasMenu 
                          ? activeMenus.filter(m => m !== menuId)
                          : [...activeMenus, menuId];
                        try {
                          await onUpdateUserAdmin(u.id, { allowedMenus: updatedMenus });
                        } catch (err: any) {
                          alert(err.message || 'মেনু কনফিগারেশন আপডেট করা যাচ্ছে না');
                        }
                      };

                      const handleToggleStatus = async () => {
                        if (!canManageUser || !onUpdateUserAdmin) return;
                        const newStatus = u.status === 'active' ? 'inactive' : 'active';
                        const confirmMsg = `${u.name} কে ${newStatus === 'inactive' ? 'ব্লক' : 'আনব্লক'} করতে চান?`;
                        if (confirm(confirmMsg)) {
                          try {
                            await onUpdateUserAdmin(u.id, { status: newStatus });
                          } catch (err: any) {
                            alert(err.message || 'স্ট্যাটাস আপডেট করা যায়নি');
                          }
                        }
                      };

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {u.photo ? (
                                <img src={u.photo} referrerPolicy="no-referrer" alt={u.name} className="w-8 h-8 rounded-full border border-slate-150 object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center text-xs">
                                  {u.name.charAt(0)}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{u.name}</p>
                                <p className="text-[10px] text-slate-500 font-mono">{u.email}</p>
                                <div className="flex gap-1.5 mt-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                    u.role === 'supper_admin' 
                                      ? 'bg-red-50 text-red-700 border border-red-100' 
                                      : u.role === 'admin'
                                        ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                  }`}>
                                    {u.role}
                                  </span>
                                  {u.designation && (
                                    <span className="text-[9px] text-slate-400 font-semibold">{u.designation}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                              {[
                                { id: 'dashboard', label: '📊 ড্যাশবোর্ড' },
                                { id: 'products', label: '📦 পণ্য' },
                                { id: 'categories', label: '🏷️ ক্যাটাগরি' },
                                { id: 'orders', label: '🛒 বিক্রয়' },
                                { id: 'crm', label: '👥 কাস্টমার' },
                                { id: 'reports', label: '📈 রিপোর্টস' },
                                { id: 'alerts', label: '🔔 মেইল লগ' },
                                { id: 'profile', label: '👤 প্রোফাইল' }
                              ].map((menuItem) => {
                                const hasAccess = activeMenus.includes(menuItem.id);
                                return (
                                  <button
                                    key={menuItem.id}
                                    type="button"
                                    disabled={!canManageUser}
                                    onClick={() => handleToggleMenu(menuItem.id)}
                                    className={`px-1.5 py-1 rounded text-[10px] font-bold border transition ${
                                      hasAccess 
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                        : 'bg-white text-slate-300 border-slate-100 hover:border-slate-200'
                                    } ${
                                      canManageUser 
                                        ? 'cursor-pointer' 
                                        : 'cursor-not-allowed opacity-60'
                                    }`}
                                    title={!canManageUser ? 'এই ব্যবহারকারীর পারমিশন পরিবর্তনের অধিকার আপনার নেই' : `মেনু পারমিশন পরিবর্তন করতে ক্লিক করুন`}
                                  >
                                    {menuItem.label}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'active' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {u.status === 'active' ? '● অ্যাক্টিভ' : '● ব্লকড'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {canManageUser ? (
                              <button
                                type="button"
                                onClick={handleToggleStatus}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer ${
                                  u.status === 'active' 
                                    ? 'bg-red-50 text-red-650 hover:bg-red-100 border border-red-200' 
                                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                }`}
                              >
                                {u.status === 'active' ? 'ব্লক করুন 🔒' : 'আনব্লক করুন ✔'}
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-bold inline-flex items-center gap-1 justify-end">
                                <Lock className="w-3 h-3 text-slate-400" /> সুরক্ষিত
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400">কোন ব্যবহারকারী পাওয়া যায়নি।</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Explanatory Safety Guidelines Box */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h5 className="text-xs font-bold text-indigo-950">অভ্যন্তরীণ সিস্টেম পারমিশন নির্দেশিকা (Role-Based Access Manual)</h5>
                <ul className="list-disc list-inside text-[11px] text-indigo-900 space-y-1 leading-relaxed">
                  <li><strong>সুপার এডমিন (Super Admin):</strong> সিস্টেমের প্রধান অ্যাডমিনিস্ট্রেটর। তিনি অ্যাডমিন ও কর্মচারীদের ব্লক/আনব্লক ও নতুন অ্যাকাউন্ট খুলতে পারেন।</li>
                  <li><strong>এডমিন (Admin):</strong> সাধারণ ম্যানেজার। তিনি শুধুমাত্র সিস্টেমের অন্যান্য কর্মচারী (Employee) অ্যাকাউন্ট যোগ ও তাদের মেনু অনুমতি কন্ট্রোল করতে পারেন। এডমিনদের অন্য এডমিন বা সুপার এডমিন ব্লক বা মডিফাই করার অধিকার নেই।</li>
                  <li><strong>পারমিশন রি-রেন্ডারঃ</strong> কাস্টম মেনু অনুমতি পরিবর্তন করার সাথে সাথে কর্মচারী প্যানেলের লিঙ্ক স্বয়ংক্রিয়ভাবে পরিবর্তিত বা লুকিয়ে যাবে।</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
