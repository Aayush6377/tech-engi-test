import { prisma } from "@/lib/prisma";

/**
 * Called after a client payment (ADVANCE_PAYMENT or FINAL_PAYMENT) is marked SUCCESS
 * Automatically creates a PENDING PAYOUT_ENGINEER transaction for the engineer
 */
export async function createEngineerPayoutFromClientPayment(
  projectId: string,
  engineerId: string,
  userId: string,
  budget: number
) {
  try {
    // Get project details
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, budget: true, engineerId: true },
    });

    if (!project || project.engineerId !== engineerId) {
      throw new Error("Invalid project or engineer");
    }

    // Check if payout already exists for this project
    const existingPayout = await prisma.transaction.findFirst({
      where: {
        projectId,
        userId,
        type: "PAYOUT_ENGINEER",
      },
    });

    if (existingPayout) {
      console.log(`Payout already exists for project ${projectId}`);
      return existingPayout;
    }

    // Get engineer's user ID
    const engineer = await prisma.engineerProfile.findUnique({
      where: { id: engineerId },
      include: { user: { select: { id: true } } },
    });

    if (!engineer) {
      throw new Error("Engineer not found");
    }

    // Create PENDING payout (70% of budget)
    const payoutAmount = budget * 0.7;
    const payout = await prisma.transaction.create({
      data: {
        projectId,
        userId: engineer.user.id,
        amount: payoutAmount,
        type: "PAYOUT_ENGINEER",
        status: "PENDING",
        description: `Engineer payout for project: ${project.title}`,
      },
    });

    console.log(`Created payout transaction: ${payout.id} for amount: ₹${payoutAmount}`);
    return payout;
  } catch (error) {
    console.error("Error creating engineer payout:", error);
    throw error;
  }
}

/**
 * Mark an engineer payout as completed (when admin processes payment)
 */
export async function completeEngineerPayout(transactionId: string) {
  try {
    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "SUCCESS" },
    });
    console.log(`Payout ${transactionId} marked as SUCCESS`);
    return updated;
  } catch (error) {
    console.error("Error completing payout:", error);
    throw error;
  }
}

/**
 * Get all pending payouts for admin dashboard
 */
export async function getPendingPayouts() {
  try {
    const pending = await prisma.transaction.findMany({
      where: {
        type: "PAYOUT_ENGINEER",
        status: "PENDING",
      },
      include: {
        project: { select: { title: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const total = pending.reduce((sum, t) => sum + t.amount, 0);

    return {
      count: pending.length,
      items: pending,
      totalAmount: total,
    };
  } catch (error) {
    console.error("Error fetching pending payouts:", error);
    throw error;
  }
}