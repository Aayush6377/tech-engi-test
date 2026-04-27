"use client";
import { useState, useEffect } from "react";
import { DollarSign, CreditCard, TrendingUp, Clock, CheckCircle, Wallet, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  project: { title: string } | null;
}

interface Stats {
  totalSpent: number;
  totalRefunded: number;
  pendingRefunds: number;
}

interface PendingProject {
  id: string;
  title: string;
  budget: number;
  status: string;
  endDate?: string;
}

interface User {
  name: string;
  email: string;
}

export default function ClientAccountPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [totalProjects, setTotalProjects] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [pendingProjects, setPendingProjects] = useState<PendingProject[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [historyRes, projectsRes, meRes] = await Promise.all([
        fetch("/api/payout/history"),
        fetch("/api/client/projects"),
        fetch("/api/auth/me"),
      ]);

      if (historyRes.ok) {
        const data = await historyRes.json();
        if (data.success) { setTransactions(data.transactions || []); setStats(data.stats); }
      }

      if (projectsRes.ok) {
        const data = await projectsRes.json();
        if (data.success) {
          setTotalProjects(data.globalStats?.total || 0);
          const budgetSum = (data.projects || []).reduce((acc: number, p: any) => acc + (p.budget || 0), 0);
          setTotalBudget(budgetSum);
          const pending = (data.projects || []).filter((p: any) =>
            p.status === "AWAITING_ADVANCE" || p.status === "AWAITING_FINAL_PAYMENT"
          );
          setPendingProjects(pending);
        }
      }

      if (meRes.ok) {
        const data = await meRes.json();
        if (data.success) setUser(data.user);
      }
    } catch (err) {
      console.error("Failed to fetch account data:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(project: PendingProject) {
    setPaying(project.id);
    try {
      const orderRes = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) { toast.error(orderData.message || "Failed to create order"); setPaying(null); return; }

      const isAdvance = project.status === "AWAITING_ADVANCE";
      const amount = isAdvance ? project.budget * 0.4 : project.budget * 0.6;

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        const rzp = new (window as any).Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          order_id: orderData.order.id,
          amount: Math.round(amount * 100),
          currency: "INR",
          name: "Tech-Engi",
          description: isAdvance ? "Advance Payment (40%)" : "Final Payment (60%)",
          image: "/logo.png",
          prefill: { name: user?.name || "", email: user?.email || "" },
          theme: { color: "#FFAE58" },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyData.success) { toast.success("Payment successful!"); fetchData(); }
              else toast.error("Payment verification failed");
            } catch { toast.error("Verification failed"); }
            finally { setPaying(null); }
          },
          modal: { ondismiss: () => { setPaying(null); toast.error("Payment cancelled"); } },
        });
        rzp.open();
      };
      document.body.appendChild(script);
    } catch { toast.error("Payment setup failed"); setPaying(null); }
  }

  const formatDate = (d: string) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getTypeLabel = (type: string) => ({
    ADVANCE_PAYMENT: "Advance Payment",
    FINAL_PAYMENT: "Final Payment",
    REFUND_CLIENT: "Refund",
  }[type] || type);

  const getStatusStyle = (status: string) =>
    status === "SUCCESS" ? "bg-green-50 text-green-700 border-green-200"
      : status === "PENDING" ? "bg-yellow-50 text-yellow-700 border-yellow-200"
        : "bg-red-50 text-red-700 border-red-200";

  // Derived values
  const successTxns = transactions.filter(t => t.status === "SUCCESS" && (t.type === "ADVANCE_PAYMENT" || t.type === "FINAL_PAYMENT"));
  const totalPaymentsCount = successTxns.length;
  const pendingAmount = totalBudget - (stats?.totalSpent || 0);

  const lastTxn = transactions.find(t => t.status === "SUCCESS" && (t.type === "ADVANCE_PAYMENT" || t.type === "FINAL_PAYMENT"));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <h1 className="text-2xl font-bold font-id" style={{ color: "var(--text-primary)" }}>Account Overview</h1>

      {/* 5 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">

        {/* 1. Total Budget */}
        <div className="rounded-xl p-5 text-white col-span-1" style={{ background: "var(--primary)" }}>
          <Wallet size={28} className="opacity-70 mb-3" />
          <p className="text-xs opacity-80 font-inter">Total Budget</p>
          <p className="text-2xl font-bold font-id mt-0.5">₹{(totalBudget || 0).toLocaleString()}</p>
          <p className="text-xs opacity-60 mt-1 font-inter">All projects</p>
        </div>

        {/* 2. Total Spent */}
        <div className="rounded-xl p-5 text-white col-span-1 bg-white border border-[var(--border)]">
          <Wallet size={28} className="text-green-400 mb-3" />
          <p className="text-xs text-[var(--text-muted)] font-inter">Total Spent</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] font-id mt-0.5">₹{(stats?.totalSpent || 0).toLocaleString()}</p>
          <p className="text-xs mt-1 text-[var(--text-muted)] font-inter">Confirmed payments</p>
        </div>

        {/* 3. Pending Amount */}
        <div className="rounded-xl p-5 bg-white border border-[var(--border)]">
          <Clock size={28} className="text-yellow-400 mb-3" />
          <p className="text-xs text-[var(--text-muted)] font-inter">Remaining to Pay</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] font-id mt-0.5">
            ₹{Math.max(0, pendingAmount).toLocaleString()}
          </p>
          <p className="text-xs mt-1 text-[var(--text-muted)] font-inter">Across all projects</p>
        </div>

        {/* 4. Total Payments */}
        <div className="rounded-xl p-5 bg-white border border-[var(--border)]">
          <CreditCard size={28} className="text-blue-400 mb-3" />
          <p className="text-xs text-[var(--text-muted)] font-inter">Total Payments</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] font-id mt-0.5">
            {totalPaymentsCount}
          </p>
          <p className="text-xs mt-1 text-[var(--text-muted)] font-inter">Successful transactions</p>
        </div>

        {/* 5. Total Projects */}
        <div className="rounded-xl p-5 bg-white border border-[var(--border)]">
          <TrendingUp size={28} className="text-green-400 mb-3" />
          <p className="text-xs text-[var(--text-muted)] font-inter">Total Projects</p>
          <p className="text-2xl font-bold text-[var(--text-primary)] font-id mt-0.5">
            {totalProjects}
          </p>
          <p className="text-xs mt-1 text-[var(--text-muted)] font-inter">All time</p>
        </div>

        {/* 6. Last Payment */}
        <div className="rounded-xl p-5 bg-white border border-[var(--border)]">
          <CheckCircle size={28} className="text-green-500 mb-3" />
          <p className="text-xs text-[var(--text-muted)] font-inter">Last Payment</p>
          {lastTxn ? (
            <>
              <p className="text-sm font-bold text-[var(--text-primary)] font-id mt-0.5 truncate">
                ₹{lastTxn.amount.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-inter mt-0.5 truncate">
                {lastTxn.project?.title || "—"}
              </p>
              <p className="text-xs text-[var(--text-muted)] font-inter mt-0.5">
                {formatDate(lastTxn.createdAt)}
              </p>
            </>
          ) : (
            <p className="text-sm font-inter mt-1" style={{ color: "var(--text-muted)" }}>No payments yet</p>
          )}
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-xl border border-[var(--border)]">
          <div className="p-5 border-b border-[var(--border)]">
            <h2 className="text-lg font-bold font-id" style={{ color: "var(--text-primary)" }}>Payment History</h2>
            <p className="text-sm font-inter mt-0.5" style={{ color: "var(--text-muted)" }}>All your transactions</p>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-16">
              <DollarSign className="mx-auto mb-3" size={40} style={{ color: "var(--border)" }} />
              <p className="font-inter text-sm" style={{ color: "var(--text-muted)" }}>No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-4 hover:bg-[var(--bg)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--primary-light)" }}>
                      <CreditCard size={16} style={{ color: "var(--primary)" }} />
                    </div>
                    <div>
                      <p className="font-semibold font-inter text-sm" style={{ color: "var(--text-primary)" }}>
                        {t.project?.title || "—"}
                      </p>
                      <p className="text-xs font-inter mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {getTypeLabel(t.type)} · {formatDate(t.createdAt)}
                      </p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {t.id.slice(0, 18)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <p className="font-bold font-id" style={{ color: "var(--text-primary)" }}>
                      ₹{t.amount.toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-inter ${getStatusStyle(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Activity */}
        <div className="col-span-1 lg:col-span-1 bg-white rounded-xl border border-[var(--border)]">
          <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-id" style={{ color: "var(--text-primary)" }}>New Activity</h2>
              <p className="text-sm font-inter mt-0.5" style={{ color: "var(--text-muted)" }}>Payments due</p>
            </div>
            {pendingProjects.length > 0 && (
              <span className="text-xs font-inter px-2 py-0.5 rounded-full text-white" style={{ background: "var(--primary)" }}>
                {pendingProjects.length} pending
              </span>
            )}
          </div>

          {pendingProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
              <CheckCircle size={36} className="mb-3 text-green-400" />
              <p className="text-sm font-inter font-semibold" style={{ color: "var(--text-primary)" }}>All caught up!</p>
              <p className="text-xs font-inter mt-1" style={{ color: "var(--text-muted)" }}>No pending payments</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {pendingProjects.map((p) => {
                const isAdvance = p.status === "AWAITING_ADVANCE";
                const amount = isAdvance ? p.budget * 0.4 : p.budget * 0.6;
                return (
                  <div key={p.id} className="p-4 hover:bg-[var(--bg)] transition-colors">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--primary-light)" }}>
                        <AlertCircle size={14} style={{ color: "var(--primary)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold font-inter truncate" style={{ color: "var(--text-primary)" }}>{p.title}</p>
                        <p className="text-xs font-inter mt-0.5" style={{ color: "var(--text-muted)" }}>
                          {isAdvance ? "Advance (40%)" : "Final payment (60%)"}
                        </p>
                        <p className="text-sm font-bold font-id mt-1" style={{ color: "var(--primary)" }}>
                          ₹{amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePay(p)}
                      disabled={paying === p.id}
                      className="w-full py-2 text-white rounded-lg text-xs font-inter font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50"
                      style={{ background: "var(--primary)" }}
                    >
                      {paying === p.id ? <Loader2 size={12} className="animate-spin" /> : null}
                      {paying === p.id ? "Processing..." : "Pay Now"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
