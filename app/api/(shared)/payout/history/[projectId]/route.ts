import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest,{ params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }
    const {projectId} = await params; 
    const transactions = await prisma.transaction.findMany({
      where: { projectId: projectId,status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { title: true } },user:{ select:{name:true}} }
    });

    let stats = {};

    if (user.role === "ENGINEER") {
      let totalReceived = 0;
      let totalPending = 0;

      for (const t of transactions) {
        if (t.type === "PAYOUT_ENGINEER") {
          if (t.status === "SUCCESS") totalReceived += t.amount;
          if (t.status === "PENDING") totalPending += t.amount;
        }
      }

      stats = { totalReceived, totalPending };

    } 
    
    else if (user.role === "CLIENT") {
      let totalSpent = 0;
      let totalRefunded = 0;
      let pendingRefunds = 0;

      for (const t of transactions) {
        if (t.type === "ADVANCE_PAYMENT" || t.type === "FINAL_PAYMENT") {
          if (t.status === "SUCCESS") totalSpent += t.amount;
        } else if (t.type === "REFUND_CLIENT") {
          if (t.status === "SUCCESS") totalRefunded += t.amount;
          if (t.status === "PENDING") pendingRefunds += t.amount;
        }
      }

      stats = { totalSpent, totalRefunded, pendingRefunds };
    }

    return NextResponse.json({ success: true, transactions, stats }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server error" }, { status: 500 });
  }
}