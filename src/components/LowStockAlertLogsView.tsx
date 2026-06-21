import React, { useState } from 'react';
import { 
  ShieldAlert, Mail, Trash2, Eye, Calendar, Terminal, CheckCircle2, User, HelpCircle, X 
} from 'lucide-react';
import { LowStockAlertLog, User as SystemUser, Product } from '../types.js';

interface LowStockAlertLogsViewProps {
  alerts: LowStockAlertLog[];
  products: Product[];
  activeUser: SystemUser;
  onClearAlertsLog: () => Promise<any>;
}

export default function LowStockAlertLogsView({
  alerts, products, activeUser, onClearAlertsLog
}: LowStockAlertLogsViewProps) {
  const isAdmin = activeUser.role === 'admin';
  const [selectedAlert, setSelectedAlert] = useState<LowStockAlertLog | null>(null);

  const handleClearLogs = async () => {
    if (!isAdmin) {
      alert('🔒 দুঃখিত, শুধুমাত্র এডমিনরা সতর্কবার্তা হিস্ট্রি ডিলিট করতে পারেন।');
      return;
    }
    if (confirm('আপনি কি নিশ্চিতভাবে সব মেইল সতর্কবার্তা হিস্ট্রি লগ মুছে ফেলতে চান?')) {
      try {
        await onClearAlertsLog();
        setSelectedAlert(null);
      } catch (err: any) {
        alert(err.message || 'Error occurred while clearing logs');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-25 duration-150" id="alerts_logs_view">
      {/* Alert Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" /> স্বয়ংক্রিয় স্টক অ্যালার্ট ও ইমেইল নোটিফিকেশন সিস্টেম
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">অটোমেটেড লো-স্টক ডিটেক্টর এবং সিকিউর SMTP ইমেইল লগ ট্র্যাকার</p>
        </div>
        <button
          type="button"
          onClick={handleClearLogs}
          disabled={!isAdmin}
          className={`px-4 py-2 border text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition ${
            isAdmin 
              ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600' 
              : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          <Trash2 className="w-4 h-4" /> অ্যালার্ট লগ পরিষ্কার করুন
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left container: list of logged emails */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-slate-800">মেইল ডেলিভারি ড্যাশবোর্ড (Delivery Ledger)</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              মোট প্রেরিতঃ {alerts.length} টি
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {alerts.map((alert) => {
              const matchedProd = products.find(p => p.id === alert.productId);
              const qtyLeft = matchedProd ? matchedProd.quantity : alert.currentQuantity;
              
              return (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:border-indigo-200 hover:bg-slate-50/50 ${
                    selectedAlert?.id === alert.id ? 'border-indigo-600 bg-indigo-50/15' : 'border-slate-100 bg-white'
                  }`}
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl mt-0.5">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        সতর্কতাঃ {alert.productName}-এর স্টক ফুরিয়ে যাচ্ছে!
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-1 leading-normal">
                        মজুদ আছেঃ <b className="text-red-650 font-extrabold">{qtyLeft} পিস</b> (রি-অর্ডার মাত্রা: {alert.threshold})
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(alert.sentAt).toLocaleString('en-GB')}</span>
                        <span className="flex items-center gap-1">📩 To: {alert.sentTo}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAlert(alert);
                    }}
                    className="self-end sm:self-center px-3 py-1.5 bg-slate-50 hover:bg-slate-100 hover:text-indigo-600 text-slate-500 rounded-xl border border-slate-200 text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> মেইল রিভিউ করুন
                  </button>
                </div>
              );
            })}
            {alerts.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <ShieldAlert className="w-12 h-12 text-slate-250 mx-auto mb-3" />
                <p className="font-semibold text-slate-500">সব পণ্য পর্যাপ্ত মজুদ আছে, কোনো মেইল প্রেরিত হয়নি!</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1 leading-normal">
                  যখনই কোনো নতুন সেলস অর্ডার করতে গিয়ে স্টকের পরিমাণ সতর্কবার্তার নিচে চলে যাবে, তখনই রিয়েল-টাইম ইমেইল নোটিফিকেশন ট্রিগার হবে।
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right container: live simulated HTML email viewer */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-emerald-500" /> প্রেরিত ইমেইল টেমপ্লেট রিভিউয়ার
          </h3>

          {selectedAlert ? (
            <div className="flex-1 mt-4 flex flex-col">
              {/* Header metadata of email */}
              <div className="space-y-1.5 text-[11px] border-b border-slate-100 pb-3 font-semibold text-slate-500">
                <div><span className="text-slate-400">From:</span> auto-alerts@inventory.com (Secure SMTP)</div>
                <div><span className="text-slate-400">To:</span> {selectedAlert.sentTo}</div>
                <div><span className="text-slate-400">Subject:</span> [⚠️ CRITICAL LOW STOCK] {selectedAlert.productName}</div>
                <div><span className="text-slate-400">Sent At:</span> {new Date(selectedAlert.sentAt).toLocaleString('en-GB')}</div>
              </div>

              {/* HTML Simulated Mail Design */}
              <div className="flex-1 mt-4 p-4 border border-indigo-50 bg-slate-50 rounded-2xl text-xs overflow-hidden leading-relaxed max-h-[300px] overflow-y-auto">
                <div className="bg-red-600 p-2.5 rounded-lg text-white font-bold text-center text-[10px] tracking-wide mb-3">
                  ALERT: CRITICAL STOCK THRESHOLD EXCEEDED
                </div>

                <p className="text-slate-800 font-bold mb-2">Dear Store Administrator / Admin,</p>
                <p className="text-slate-600 mb-3 text-[11px]">
                  This is an automated critical systems alert notifying you that the following product in the inventory has fallen below its configured threshold limit:
                </p>

                <div className="bg-white p-3 rounded-xl border border-rose-100 space-y-1.5 font-semibold text-[11px] mb-3 text-slate-800">
                  <div>• Product: {selectedAlert.productName}</div>
                  <div>• Item ID: <span className="font-mono">{selectedAlert.productId}</span></div>
                  <div>• Configured Threshold: {selectedAlert.threshold} units</div>
                  <div className="text-red-600">• Current stock remaining: {selectedAlert.currentQuantity} units remaining</div>
                </div>

                <p className="text-slate-650 text-[10px] mb-3">
                  We highly recommend issuing a purchasing re-order request immediately with suppliers to avoid catalog shortfalls or delivery cancellations.
                </p>

                <div className="border-t border-slate-200 pt-3 text-[9px] text-slate-400 font-bold">
                  SMTP Mail Server System ID: <span className="font-mono">IPM-ALERT-{selectedAlert.id}</span>
                </div>
              </div>

              {/* Status footer */}
              <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> মেইল স্ট্যাটাসঃ সফলভাবে পাঠানো হয়েছে (Delivered)
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <Mail className="w-12 h-12 text-slate-250 mb-3 animate-bounce" />
              <p className="font-bold text-slate-500">নির্বাচন করুন</p>
              <p className="text-[11px] mt-0.5 max-w-xs mx-auto leading-normal">
                বাম পাশের লগ থেকে যেকোনো একটি সতর্কবার্তা ইমেইল নির্বাচন করুন এর সম্পূর্ণ কোড ও HTML রেন্ডারিং লেআউট প্রীতি-রিভিউ দেখতে।
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
