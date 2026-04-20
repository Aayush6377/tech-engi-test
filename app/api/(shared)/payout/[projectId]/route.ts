import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET( req: NextRequest, { params }: { params: Promise<{ projectId: string }> } ) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }
    const { projectId } = await params; 

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      return NextResponse.json({ success: false, message: "Project Not Found" }, { status: 404 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { projectId: projectId },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { title: true } } },
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

      stats = { budget: project.budget * 0.7, amountPaid: totalReceived, amountPending: totalPending };

    } else if (user.role === "CLIENT") {
      let totalAmount = 0;

      for (const t of transactions) {
        if (t.type === "PAYOUT_ENGINEER") {
          if (t.status === "SUCCESS" && t.userId === project!.clientId)
            totalAmount += t.amount;
        }
      }

      const lastTransaction = transactions.filter( (transaction) => transaction.status === "SUCCESS" )?.[0];

      stats = {
        remaining: project!.budget - totalAmount,
        budget: project.budget,
        lastTransaction: lastTransaction
          ? { amount: lastTransaction.amount, date: lastTransaction.createdAt }
          : {},
        progress: project.progress,
        approved: project!.status === "COMPLETED",
      };

    } else if (user.role === "ADMIN") {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { id: project.clientId },
        include: { user: true },
      });

      const engineerProfile = await prisma.engineerProfile.findUnique({
        where: { id: project.engineerId ?? undefined },
        include: { user: { include: { payoutDetail: true } } },
      });

      const users = [];
      if (clientProfile?.user) {
        users.push(clientProfile.user);
      }

      if (engineerProfile?.user) {
        users.push(engineerProfile.user);
      }

      const totalReceived = transactions.reduce((acc, transaction) => {
        const amount = transaction.userId === project.clientId && transaction.status === "SUCCESS" ? transaction.amount : 0;
        return acc + amount;
      }, 0);

      stats = {
        users: users,
        budget: project.budget,
        totalReceived,
        progress: project.progress,
        approved: project!.status === "COMPLETED",
      };
    }

    return NextResponse.json({ success: true, stats, transactions }, { status: 200 });
  } catch {
    return NextResponse.json( { success: false, message: "Internal Server error" }, { status: 500 } );
  }
}
