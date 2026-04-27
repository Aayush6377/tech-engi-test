import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ENGINEER") {
      return NextResponse.json({ success: false, message: "Engineer access required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "monthly"; // weekly | monthly | yearly

    const now = new Date();
    let periodStart: Date;
    if (period === "weekly") {
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
    } else if (period === "yearly") {
      periodStart = new Date(now.getFullYear(), 0, 1);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const engineerProfile = user.engineerProfile;
    const engineerId = engineerProfile?.id;
    const userId = user.id;

    const [allProjects, periodProjects, invitations, allTransactions, periodTransactions] = await Promise.all([
      engineerId
        ? prisma.project.findMany({
            where: { engineerId },
            select: { id: true, title: true, status: true, budget: true, createdAt: true, updatedAt: true },
            orderBy: { updatedAt: "desc" },
          })
        : Promise.resolve([]),

      engineerId
        ? prisma.project.findMany({
            where: { engineerId, createdAt: { gte: periodStart } },
            select: { id: true, status: true, budget: true, createdAt: true },
          })
        : Promise.resolve([]),

      engineerId
        ? prisma.projectInvitation.findMany({
            where: { engineerId, status: "SENT" },
            include: { project: { select: { id: true, title: true, budget: true } } },
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),

      prisma.transaction.findMany({
        where: { userId, type: "PAYOUT_ENGINEER", status: "SUCCESS" },
        select: { amount: true, createdAt: true },
      }),

      prisma.transaction.findMany({
        where: { userId, type: "PAYOUT_ENGINEER", status: "SUCCESS", createdAt: { gte: periodStart } },
        select: { amount: true, createdAt: true },
      }),
    ]);

    // All-time stats
    const totalPotentialEarnings = allProjects.reduce((s, p) => s + p.budget * 0.7, 0);
    const totalEarned = allTransactions.reduce((s, t) => s + t.amount, 0);
    const totalPending = Math.max(0, totalPotentialEarnings - totalEarned);

    // Period stats
    const periodEarnings = periodTransactions.reduce((s, t) => s + t.amount, 0);
    const periodProjects_count = periodProjects.length;
    const periodCompleted = periodProjects.filter(p => p.status === "COMPLETED").length;
    const periodPotential = periodProjects.reduce((s, p) => s + p.budget * 0.7, 0);

    // Build revenue chart data
    const revenueChart = buildRevenueChart(allTransactions, period);

    // Build project distribution
    const statusMap: Record<string, string> = {
      IN_PROGRESS: "In Progress",
      COMPLETED: "Completed",
      SEARCHING: "Searching",
      AWAITING_FINAL_PAYMENT: "Awaiting Final Payment",
      CANCELED: "Canceled",
    };
    const distMap: Record<string, number> = {};
    for (const p of allProjects) {
      const label = statusMap[p.status] || p.status;
      distMap[label] = (distMap[label] || 0) + 1;
    }
    const projectDistribution = Object.entries(distMap).map(([name, value]) => ({ name, value }));

    return NextResponse.json({
      success: true,
      data: {
        period,
        overview: {
          totalAssigned: allProjects.length,
          completedProjects: engineerProfile?.completedProjects ?? 0,
          newInvitations: invitations.length,
        },
        periodStats: {
          projects: periodProjects_count,
          completed: periodCompleted,
          earnings: periodEarnings,
          potential: periodPotential,
        },
        financials: {
          totalEarned,
          totalPending,
          totalPotentialEarnings,
        },
        invitations: invitations.map((inv) => ({
          id: inv.id,
          projectId: inv.projectId,
          title: inv.project.title,
          earning: inv.project.budget * 0.7,
          date: inv.createdAt,
        })),
        revenueChart,
        projectDistribution,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

function buildRevenueChart(transactions: { amount: number; createdAt: Date }[], period: string) {
  if (period === "yearly") {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const map: Record<number, number> = {};
    for (const t of transactions) {
      const m = new Date(t.createdAt).getMonth();
      map[m] = (map[m] || 0) + t.amount;
    }
    return months.map((name, i) => ({ name, value: map[i] || 0 }));
  }
  if (period === "weekly") {
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - 6 + i);
      const dayName = days[d.getDay()];
      const value = transactions
        .filter(t => {
          const td = new Date(t.createdAt);
          return td.toDateString() === d.toDateString();
        })
        .reduce((s, t) => s + t.amount, 0);
      return { name: dayName, value };
    });
  }
  // monthly — days of current month
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const map: Record<number, number> = {};
  for (const t of transactions) {
    const td = new Date(t.createdAt);
    if (td.getMonth() === now.getMonth() && td.getFullYear() === now.getFullYear()) {
      const day = td.getDate();
      map[day] = (map[day] || 0) + t.amount;
    }
  }
  // Group into ~6 buckets for readability
  const bucketSize = Math.ceil(daysInMonth / 6);
  const buckets: { name: string; value: number }[] = [];
  for (let start = 1; start <= daysInMonth; start += bucketSize) {
    const end = Math.min(start + bucketSize - 1, daysInMonth);
    const value = Array.from({ length: end - start + 1 }, (_, i) => map[start + i] || 0).reduce((a, b) => a + b, 0);
    buckets.push({ name: `${start}`, value });
  }
  return buckets;
}