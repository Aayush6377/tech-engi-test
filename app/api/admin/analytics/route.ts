import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const { error } = await getAdmin();
    if (error) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 403 });
    }
    const [ userRoleCounts, projects, openTicketsCount, pendingDeletionsCount, pendingTransactionsCount ] = await Promise.all([
      
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),

      prisma.project.findMany({ select: { status: true, budget: true } }),

      prisma.ticket.count({ where: { status: "OPEN" } }),

      prisma.projectDeletionRequest.count({ where: { status: "PENDING" } }),

      prisma.transaction.count({ where: { status: "PENDING" } })
    ]);

    let totalClients = 0;
    let totalEngineers = 0;

    for (const group of userRoleCounts) {
      if (group.role === "CLIENT") totalClients = group._count._all;
      if (group.role === "ENGINEER") totalEngineers = group._count._all;
    }

    let totalVolume = 0; 
    let completedVolume = 0;

    const projectStats = {
      total: projects.length,
      active: 0,
      completed: 0,
      canceled: 0,
      drafts: 0
    };

    for (const p of projects) {
      totalVolume += p.budget;

      if (["SEARCHING", "IN_PROGRESS", "IN_REVIEW", "AWAITING_FINAL_PAYMENT"].includes(p.status)) {
        projectStats.active++;
      } else if (p.status === "COMPLETED") {
        projectStats.completed++;
        completedVolume += p.budget;
      } else if (p.status === "CANCELED") {
        projectStats.canceled++;
      } else {
        projectStats.drafts++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalClients + totalEngineers,
          clients: totalClients,
          engineers: totalEngineers
        },
        projects: projectStats,
        financials: {
          totalPlatformVolume: totalVolume,
          completedProjectValue: completedVolume,
        },
        actionRequired: {
          openSupportTickets: openTicketsCount,
          pendingCancellations: pendingDeletionsCount,
          pendingLedgerActions: pendingTransactionsCount
        }
      }
    }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}