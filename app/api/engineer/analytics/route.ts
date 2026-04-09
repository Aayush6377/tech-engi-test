import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEngineer } from "@/lib/auth";

export async function GET() {
  try {
    const { user, error } = await getEngineer();
    if (error || !user?.engineerProfile) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const engineerId = user.engineerProfile.id;
    const userId = user.id;

    const [projects, invitations, transactions] = await Promise.all([
      
      prisma.project.findMany({
        where: { engineerId },
        select: { id: true, title: true, status: true, budget: true, createdAt: true },
        orderBy: { updatedAt: "desc" }
      }),

      prisma.projectInvitation.findMany({
        where: { engineerId, status: "SENT" },
        include: { project: { select: { id: true, title: true, budget: true } } },
        orderBy: { createdAt: "desc" }
      }),

      prisma.transaction.findMany({
        where: { userId, type: "PAYOUT_ENGINEER" },
        include: { project: { select: { title: true } } },
        orderBy: { createdAt: "desc" }
      })
    ]);

    let totalEarnedAmount = 0;
    let pendingPayoutAmount = 0;
    const pendingPayoutsList = [];
    const completedPayoutsList = [];

    for (const tx of transactions) {
      const payoutData = {
        id: tx.id,
        amount: tx.amount,
        projectTitle: tx.project.title,
        date: tx.createdAt
      };

      if (tx.status === "SUCCESS") {
        totalEarnedAmount += tx.amount;
        completedPayoutsList.push(payoutData);
      } else if (tx.status === "PENDING") {
        pendingPayoutAmount += tx.amount;
        pendingPayoutsList.push(payoutData);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalAssigned: projects.length,
          completedProjects: user.engineerProfile.completedProjects,
          newInvitations: invitations.length
        },
        invitations: invitations.map(inv => ({
            id: inv.id,
            projectId: inv.projectId,
            title: inv.project.title,
            earning: inv.project.budget * 0.7,
            date: inv.createdAt
        })),
        financials: {
          totalEarned: totalEarnedAmount,
          totalPending: pendingPayoutAmount,
          pendingPayouts: {
            count: pendingPayoutsList.length,
            items: pendingPayoutsList
          },
          completedPayouts: {
            count: completedPayoutsList.length,
            items: completedPayoutsList
          }
        }
      }
    }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}