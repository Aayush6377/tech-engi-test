import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClient } from "@/lib/auth";

export async function GET() {
  try {
    const { user, error } = await getClient();
    if (error || !user?.clientProfile) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const clientId = user.clientProfile.id;

    const projects = await prisma.project.findMany({
      where: { clientId },
      select: {
        id: true,
        title: true,
        status: true,
        budget: true,
        advancePaid: true,
        isFinalPaymentMade: true,
        createdAt: true,
      },
      orderBy: { updatedAt: "desc" }
    });

    const totalProjects = projects.length;
    let activeProjects = 0;
    let completedProjects = 0;
    let canceledProjects = 0;

    let totalPending40Amount = 0;
    let totalPending60Amount = 0;

    const pending60Payments: Array<{ id: string, title: string, amount: number }> = [];
    const pending40Payments: Array<{ id: string, title: string, amount: number }> = [];

    for (const p of projects) {
      
      if (["SEARCHING", "IN_PROGRESS", "IN_REVIEW", "AWAITING_FINAL_PAYMENT"].includes(p.status)) {
        activeProjects++;
      } else if (p.status === "COMPLETED") {
        completedProjects++;
      } else if (p.status === "CANCELED") {
        canceledProjects++;
      }

      if (p.status === "AWAITING_FINAL_PAYMENT" && !p.isFinalPaymentMade) {
        const amount = p.budget * 0.60;
        totalPending60Amount += amount;
        pending60Payments.push({ id: p.id, title: p.title, amount });
      }

      if (p.status === "AWAITING_ADVANCE" && !p.advancePaid) {
        const amount = p.budget * 0.40;
        totalPending40Amount += amount;
        pending40Payments.push({ id: p.id, title: p.title, amount });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalProjects,
          activeProjects,
          completedProjects,
          canceledProjects
        },
        financials: {
          totalOwed: totalPending60Amount + totalPending40Amount,
          pendingFinalPayments: {
            totalAmount: totalPending60Amount,
            count: pending60Payments.length,
            projects: pending60Payments,
          },
          pendingAdvancePayments: {
            totalAmount: totalPending40Amount,
            count: pending40Payments.length,
            projects: pending40Payments,
          }
        }
      }
    }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}