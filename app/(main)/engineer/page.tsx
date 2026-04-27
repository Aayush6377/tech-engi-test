"use client";
import { useEffect, useState, useCallback } from "react";
import { Eye, ReceiptText, Activity, CheckCircle } from "lucide-react";
import StatCard, { Period } from "@/components/dashboard/StatCard";
import ProjectDistribution from "@/components/dashboard/ProjectDistribution";
import RevenueChart from "@/components/dashboard/RevenueChart";
import DashboardShell from "@/components/layout/DashboardShell";

interface AnalyticsData {
  overview: { totalAssigned: number; completedProjects: number; newInvitations: number };
  periodStats: { projects: number; completed: number; earnings: number; potential: number };
  financials: { totalEarned: number; totalPending: number; totalPotentialEarnings: number };
  revenueChart: { monthly: any[]; yearly: any[]; weekly: any[] };
  projectDistribution: { name: string; value: number }[];
}

type CardKey = "projects" | "revenue" | "received" | "pending";

export default function EngineerDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<Record<CardKey, Period>>({
    projects: "monthly",
    revenue: "monthly",
    received: "monthly",
    pending: "monthly",
  });
  // cache fetched data per period to avoid redundant calls
  const [cache, setCache] = useState<Record<string, AnalyticsData>>({});

  const fetchAnalytics = useCallback(async (period: Period) => {
    if (cache[period]) {
      setData(cache[period]);
      return;
    }
    try {
      const res = await fetch(`/api/engineer/analytics?period=${period}`);
      const json = await res.json();
      if (json.success) {
        // shape revenueChart into { monthly, yearly, weekly } keyed object
        const shaped: AnalyticsData = {
          ...json.data,
          revenueChart: { [period]: json.data.revenueChart },
        };
        setCache(prev => ({ ...prev, [period]: shaped }));
        setData(shaped);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [cache]);

  // Fetch for each card's period independently
  const [cardData, setCardData] = useState<Record<CardKey, AnalyticsData | null>>({
    projects: null, revenue: null, received: null, pending: null,
  });

  const fetchForCard = useCallback(async (card: CardKey, period: Period) => {
    try {
      const res = await fetch(`/api/engineer/analytics?period=${period}`);
      const json = await res.json();
      if (json.success) {
        setCardData(prev => ({ ...prev, [card]: { ...json.data, revenueChart: { [period]: json.data.revenueChart } } }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    // initial load for all cards with default monthly
    const init = async () => {
      const res = await fetch(`/api/engineer/analytics?period=monthly`);
      const json = await res.json();
      if (json.success) {
        const shaped: AnalyticsData = { ...json.data, revenueChart: { monthly: json.data.revenueChart } };
        setCardData({ projects: shaped, revenue: shaped, received: shaped, pending: shaped });
        setData(shaped);
      }
      setLoading(false);
    };
    init();
  }, []);

  function handlePeriodChange(card: CardKey, period: Period) {
    setPeriods(prev => ({ ...prev, [card]: period }));
    fetchForCard(card, period);
  }

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  // For charts, use revenue card's period
  const revPeriod = periods.revenue;
  const revData = cardData.revenue?.revenueChart?.[revPeriod] || [];
  const totalRevenue = cardData.revenue?.financials?.totalPotentialEarnings || 0;
  const distribution = data?.projectDistribution || [];

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "var(--primary)" }} />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-id text-[var(--text-primary)]">Dashboard</h1>
      </div>

      {/* Stat cards — each with its own period dropdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Projects"
          value={String(cardData.projects?.periodStats?.projects ?? cardData.projects?.overview?.totalAssigned ?? 0)}
          icon={<Eye size={16} />}
          period={periods.projects}
          onPeriodChange={p => handlePeriodChange("projects", p)}
          change={cardData.projects?.periodStats?.completed
            ? `${cardData.projects.periodStats.completed} done`
            : undefined}
          changeType="up"
        />
        <StatCard
          title="Total Earnings (Potential)"
          value={fmt(cardData.revenue?.periodStats?.potential ?? 0)}
          icon={<ReceiptText size={16} />}
          period={periods.revenue}
          onPeriodChange={p => handlePeriodChange("revenue", p)}
        />
        <StatCard
          title="Amount Received"
          value={fmt(cardData.received?.periodStats?.earnings ?? 0)}
          icon={<Activity size={16} />}
          period={periods.received}
          onPeriodChange={p => handlePeriodChange("received", p)}
        />
        <StatCard
          title="Amount Pending"
          value={fmt(cardData.pending?.financials?.totalPending ?? 0)}
          icon={<CheckCircle size={16} />}
          period={periods.pending}
          onPeriodChange={p => handlePeriodChange("pending", p)}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectDistribution data={distribution} />
        <RevenueChart
          data={{ [revPeriod]: revData }}
          totalRevenue={totalRevenue}
        />
      </div>
    </DashboardShell>
  );
}
