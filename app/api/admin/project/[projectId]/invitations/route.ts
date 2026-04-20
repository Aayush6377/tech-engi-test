import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";
import sendEmail from "@/lib/email";
import { projectInvitationTemplate } from "@/lib/templates";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json(
        { success: false, message: error || "Unauthorized" },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    // const invitation = await prisma.projectInvitation.findUnique({
    //   where: { id: invitationId },
    //   include: {
    //     project: true,
    //     engineer: {
    //       include: {
    //         user: {
    //           select: { id: true, name: true, email: true, image: true },
    //         },
    //       },
    //     },
    //   },
    // });

    // if (!invitation) {
    //   return NextResponse.json(
    //     { success: false, message: "Invitation not found" },
    //     { status: 404 }
    //   );
    // }

    // const budget = invitation.project.budget;
    // const engineerCut = budget * 0.7;
    // const platformProfit = budget * 0.3;

    return NextResponse.json(
      {
        success: true,
        // invitation: invitation,
        // financials: {
        //   totalBudget: budget,
        //   engineerCut: engineerCut,
        //   platformProfit: platformProfit,
        // },
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
