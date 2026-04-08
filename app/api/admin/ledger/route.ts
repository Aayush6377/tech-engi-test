import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

export async function GET() {
  try {
    const { error } = await getAdmin();
    if (error) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 403 });
    }

    const [pendingFinalPayments, pendingRefunds, pendingPayouts] = await Promise.all([
      
      prisma.project.findMany({
        where: { status: "AWAITING_FINAL_PAYMENT", isFinalPaymentMade: false },
        include: {
          client: { include: { user: { select: { name: true, email: true } } } },
          engineer: { include: { user: { select: { name: true, email: true } } } }
        },
        orderBy: { updatedAt: "desc" }
      }),

      prisma.transaction.findMany({
        where: { type: "REFUND_CLIENT", status: "PENDING" },
        include: {
          user: { 
            select: { name: true, email: true, payoutDetail: true } 
          },
          project: { select: { title: true, id: true } }
        },
        orderBy: { createdAt: "desc" }
      }),

      prisma.transaction.findMany({
        where: { type: "PAYOUT_ENGINEER", status: "PENDING" },
        include: {
          user: { 
            select: { name: true, email: true, payoutDetail: true } 
          },
          project: { select: { title: true, id: true } }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    return NextResponse.json({ success: true, data: { pendingFinalPayments, pendingRefunds, pendingPayouts } }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}