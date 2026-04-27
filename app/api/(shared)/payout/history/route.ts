import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET() {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    // ─── ENGINEER ────────────────────────────────────────────────────────────
    if (user.role === "ENGINEER") {
      const engineerProfile = user.engineerProfile;

      if (!engineerProfile) {
        return NextResponse.json(
          { success: true, transactions: [], stats: { totalReceived: 0, totalPending: 0 } },
          { status: 200 }
        );
      }

      // Fetch PAYOUT_ENGINEER transactions for this engineer
      const payoutTransactions = await prisma.transaction.findMany({
        where: { userId: user.id, type: "PAYOUT_ENGINEER" },
        orderBy: { createdAt: "desc" },
        include: { project: { select: { title: true } } },
      });

      // Build a Set of project IDs that already have a payout transaction
      const projectsWithPayout = new Set(payoutTransactions.map((t) => t.projectId));

      // Fetch all assigned projects
      const allProjects = await prisma.project.findMany({
        where: { engineerId: engineerProfile.id },
        select: { id: true, budget: true },
      });

      // For each assigned project that has NO payout transaction yet, create a PENDING one.
      // Only create if there has been an actual client payment (advance or final) for that project.
      const newPayouts: typeof payoutTransactions = [];

      for (const project of allProjects) {
        if (projectsWithPayout.has(project.id)) continue;

        // Check if the client has paid anything for this project
        const clientPayment = await prisma.transaction.findFirst({
          where: {
            projectId: project.id,
            type: { in: ["ADVANCE_PAYMENT", "FINAL_PAYMENT"] },
            status: "SUCCESS",
          },
        });

        if (!clientPayment) continue; // Client hasn't paid yet — don't create a payout record

        const payoutAmount = project.budget * 0.7;
        const created = await prisma.transaction.create({
          data: {
            projectId: project.id,
            userId: user.id,
            amount: payoutAmount,
            type: "PAYOUT_ENGINEER",
            status: "PENDING",
          },
          include: { project: { select: { title: true } } },
        });

        newPayouts.push(created);
      }

      // Merge original + newly created, re-sort by createdAt desc
      const allPayouts = [...payoutTransactions, ...newPayouts].sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      // Compute stats
      let totalReceived = 0;
      let totalPending = 0;

      for (const t of allPayouts) {
        if (t.status === "SUCCESS") totalReceived += t.amount;
        else if (t.status === "PENDING") totalPending += t.amount;
      }

      return NextResponse.json(
        {
          success: true,
          transactions: allPayouts,
          stats: { totalReceived, totalPending },
        },
        { status: 200 }
      );
    }

    // ─── CLIENT ───────────────────────────────────────────────────────────────
    if (user.role === "CLIENT") {
      const transactions = await prisma.transaction.findMany({
        where: {
          userId: user.id,
          type: { in: ["ADVANCE_PAYMENT", "FINAL_PAYMENT", "REFUND_CLIENT"] },
        },
        orderBy: { createdAt: "desc" },
        include: { project: { select: { title: true } } },
      });

      let totalSpent = 0;
      let totalRefunded = 0;
      let pendingRefunds = 0;

      for (const t of transactions) {
        if (
          (t.type === "ADVANCE_PAYMENT" || t.type === "FINAL_PAYMENT") &&
          t.status === "SUCCESS"
        ) {
          totalSpent += t.amount;
        } else if (t.type === "REFUND_CLIENT") {
          if (t.status === "SUCCESS") totalRefunded += t.amount;
          if (t.status === "PENDING") pendingRefunds += t.amount;
        }
      }

      return NextResponse.json(
        { success: true, transactions, stats: { totalSpent, totalRefunded, pendingRefunds } },
        { status: 200 }
      );
    }

    // ─── ADMIN or other roles ─────────────────────────────────────────────────
    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { title: true } } },
    });

    return NextResponse.json({ success: true, transactions, stats: {} }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}