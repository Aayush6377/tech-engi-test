"use client";
import { useState, useEffect } from "react";
import { DollarSign, Wallet, TrendingUp, Clock, CheckCircle, CreditCard } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";

interface PayoutItem {
  id: string;
  amount: number;
  projectTitle: string;
  date: string;
}

interface Financials {
  totalEarned: number;
  totalPending: number;
  totalPotentialEarnings: number;
  pendingPayouts: { count: number; items: PayoutItem[] };
  completedPayouts: { count: number; items: PayoutItem[] };
}

interface Overview {
  totalAssigned: number;
  completedProjects: number;
  newInvitations: number;
}

export default function EngineerPayoutPage() {
  const [financials, setFinancials] = useState<Financials | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await fetch("/api/engineer/analytics");
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFinancials(data.data.financials);
          setOverview(data.data.overview);
        }
      }
    } catch (err) {
      console.error("Failed to fetch payout data:", err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-IN", { 
        day: "2-digit", 
        month: "short", 
        year: "numeric" 
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "SUCCESS") {
      return "bg-green-50 text-green-700 border-green-200";
    } else if (status === "PENDING") {
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-[80vh]">
          <div 
            className="animate-spin rounded-full h-10 w-10 border-b-2" 
            style={{ borderColor: "var(--primary)" }} 
          />
        </div>
      </DashboardShell>
    );
  }

  const amountReceived = financials?.totalEarned || 0;
  const amountPending = financials?.totalPending || 0;
  const totalPotential = financials?.totalPotentialEarnings || 0;
  const lastPayout = financials?.completedPayouts.items[0] || null;

  const allTransactions = [
    ...(financials?.completedPayouts.items || []).map((t) => ({ ...t, status: "SUCCESS" })),
    ...(financials?.pendingPayouts.items || []).map((t) => ({ ...t, status: "PENDING" })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <DashboardShell>
      <div className="space-y-6 p-1">
        <h1 className="text-2xl font-bold font-id" style={{ color: "var(--text-primary)" }}>
          My Payouts
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. Total Potential Earnings */}
          <div className="rounded-xl p-5 text-white" style={{ background: "var(--primary)" }}>
            <Wallet size={28} className="opacity-70 mb-3" />
            <p className="text-xs font-inter">Total Amount</p>
            <p className="text-2xl font-bold font-id mt-0.5">₹{totalPotential.toLocaleString()}</p>
          </div>

          {/* 2. Amount Received */}
          <div className="rounded-xl p-5 bg-white border border-[var(--border)]">
            <CheckCircle size={28} className="text-green-500 mb-3" />
            <p className="text-xs font-inter" style={{ color: "var(--text-muted)" }}>
              Amount Received
            </p>
            <p className="text-2xl font-bold font-id mt-0.5" style={{ color: "var(--text-primary)" }}>
              ₹{amountReceived.toLocaleString()}
            </p>
            <p className="text-xs mt-1 font-inter text-green-600">Successfully paid out</p>
          </div>

          {/* 3. Amount Pending */}
          <div className="rounded-xl p-5 bg-white border border-[var(--border)]">
            <Clock size={28} className="text-yellow-500 mb-3" />
            <p className="text-xs font-inter" style={{ color: "var(--text-muted)" }}>
              Amount Pending
            </p>
            <p className="text-2xl font-bold font-id mt-0.5" style={{ color: "var(--text-primary)" }}>
              ₹{amountPending.toLocaleString()}
            </p>
            <p className="text-xs mt-1 font-inter text-yellow-600">Awaiting release</p>
          </div>

          {/* 4. Total Projects */}
          <div className="rounded-xl p-5 bg-white border border-[var(--border)]">
            <TrendingUp size={28} className="text-blue-500 mb-3" />
            <p className="text-xs font-inter" style={{ color: "var(--text-muted)" }}>
              Total Projects
            </p>
            <p className="text-2xl font-bold font-id mt-0.5" style={{ color: "var(--text-primary)" }}>
              {overview?.totalAssigned || 0}
            </p>
            <p className="text-xs mt-1 font-inter" style={{ color: "var(--text-muted)" }}>
              {overview?.completedProjects || 0} completed
            </p>
          </div>

          {/* 5. Last Payment */}
          <div className="rounded-xl p-5 bg-white border border-[var(--border)]">
            <CreditCard size={28} className="text-purple-500 mb-3" />
            <p className="text-xs font-inter" style={{ color: "var(--text-muted)" }}>
              Last Payment
            </p>
            {lastPayout ? (
              <>
                <p className="text-sm font-bold font-id mt-0.5" style={{ color: "var(--text-primary)" }}>
                  ₹{lastPayout.amount.toLocaleString()}
                </p>
                <p className="text-xs font-inter mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                  {lastPayout.projectTitle}
                </p>
                <p className="text-xs font-inter mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {formatDate(lastPayout.date)}
                </p>
              </>
            ) : (
              <p className="text-sm font-inter mt-1" style={{ color: "var(--text-muted)" }}>
                No payments yet
              </p>
            )}
          </div>
        </div>

        {/* Payout History */}
        <div className="bg-white rounded-xl border border-[var(--border)]">
          <div className="p-5 border-b border-[var(--border)]">
            <h2 className="text-lg font-bold font-id" style={{ color: "var(--text-primary)" }}>
              Payout History
            </h2>
            <p className="text-sm font-inter mt-0.5" style={{ color: "var(--text-muted)" }}>
              All your payout transactions
            </p>
          </div>

          {allTransactions.length === 0 ? (
            <div className="text-center py-16">
              <DollarSign className="mx-auto mb-3" size={40} style={{ color: "var(--border)" }} />
              <p className="font-inter text-sm" style={{ color: "var(--text-muted)" }}>
                No payout history yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {allTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-[var(--bg)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "var(--primary-light)" }}
                    >
                      <CreditCard size={16} style={{ color: "var(--primary)" }} />
                    </div>
                    <div>
                      <p className="font-semibold font-inter text-sm" style={{ color: "var(--text-primary)" }}>
                        {t.projectTitle}
                      </p>
                      <p className="text-xs font-inter mt-0.5" style={{ color: "var(--text-muted)" }}>
                        Engineer Payout · {formatDate(t.date)}
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
      </div>
    </DashboardShell>
  );
}