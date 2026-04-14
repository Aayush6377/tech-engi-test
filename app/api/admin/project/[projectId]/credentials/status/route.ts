import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        progress: true,
        isEngineerFinished: true,
        isFinalPaymentMade: true,
        status: true,
        // Treat COMPLETED status as review approved + final payment made
        // Or you can add a dedicated `isReviewApproved` boolean to your schema
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // isReviewApproved: project moved past IN_REVIEW stage
    // (i.e., status is AWAITING_FINAL_PAYMENT or COMPLETED)
    const isReviewApproved =
      project.status === "AWAITING_FINAL_PAYMENT" ||
      project.status === "COMPLETED";

    return NextResponse.json({
      progress: project.progress,
      isEngineerFinished: project.isEngineerFinished,
      isFinalPaymentMade: project.isFinalPaymentMade,
      isReviewApproved,
    });
  } catch (error) {
    console.error("[CREDENTIALS_STATUS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}