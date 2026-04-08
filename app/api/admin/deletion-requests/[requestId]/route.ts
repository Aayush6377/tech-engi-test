import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";
import { deleteFile } from "@/lib/uploads";
import sendEmail from "@/lib/email";
import { deletionRequestApprovedTemplate, deletionRequestRejectedTemplate } from "@/lib/templates";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { error } = await getAdmin();
    if (error){
        return NextResponse.json({ success: false, message: error }, { status: 403 });
    }

    const { requestId } = await params;

    const request = await prisma.projectDeletionRequest.findUnique({
      where: { id: requestId },
      include: {
        project: {
          include: {
            client: { include: { user: { select: { name: true, email: true } } } },
            engineer: { include: { user: { select: { name: true, email: true } } } },
            tickets: true
          }
        }
      }
    });

    if (!request){
        return NextResponse.json({ success: false, message: "Request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, request }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

const actionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"])
});

export async function PATCH( req: NextRequest, { params }: { params: Promise<{ requestId: string }> } ) {
  try {
    const { error } = await getAdmin();
    if (error){
        return NextResponse.json({ success: false, message: error }, { status: 403 });
    }

    const { requestId } = await params;
    const body = await req.json();
    const validation = actionSchema.safeParse(body);
    
    if (!validation.success){
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    const deletionRequest = await prisma.projectDeletionRequest.findUnique({
      where: { id: requestId },
      include: {
        project: {
          include: {
            client: { include: { user: { select: { name: true, email: true } } } },
            engineer: { include: { user: { select: { name: true, email: true } } } },
            resources: true
          }
        }
      }
    });

    if (!deletionRequest || deletionRequest.status !== "PENDING") {
      return NextResponse.json({ success: false, message: "Request not found or already processed" }, { status: 404 });
    }

    const project = deletionRequest.project;
    const clientUser = project.client.user;
    const engineerUser = project.engineer?.user;

    // reject request
    if (validation.data.action === "REJECT") {
      await prisma.projectDeletionRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      });

      if (clientUser.email) {
        const emailHtml = deletionRequestRejectedTemplate(clientUser.name || "Client", project.title);
        await sendEmail(clientUser.email, `Update: Deletion Request Rejected - ${project.title}`, emailHtml);
      }

      return NextResponse.json({ success: true, message: "Deletion request rejected" }, { status: 200 });
    }

    const clientRefundAmount = project.budget * 0.20;
    const engineerCompensationAmount = project.budget * 0.10;

    await prisma.$transaction(async (tx) => {

      await tx.projectDeletionRequest.update({ where: { id: requestId }, data: { status: "APPROVED" } });

      await tx.project.update({ where: { id: project.id }, data: { status: "CANCELED" } });

      await tx.transaction.create({
        data: {
          projectId: project.id,
          userId: project.client.userId, 
          amount: clientRefundAmount,
          type: "REFUND_CLIENT",
          status: "PENDING"
        }
      });

      if (project.engineer) {
        await tx.transaction.create({
          data: {
            projectId: project.id,
            userId: project.engineer.userId,
            amount: engineerCompensationAmount,
            type: "PAYOUT_ENGINEER",
            status: "PENDING"
          }
        });
      }
    });

    if (clientUser.email) {
      const clientEmailHtml = deletionRequestApprovedTemplate(clientUser.name || "Client", project.title, clientRefundAmount, false);
      await sendEmail(clientUser.email, `Project Cancelled: ${project.title}`, clientEmailHtml);
    }

    if (engineerUser && engineerUser.email) {
      const engEmailHtml = deletionRequestApprovedTemplate(engineerUser.name || "Engineer", project.title, engineerCompensationAmount, true);
      await sendEmail(engineerUser.email, `Project Cancelled: ${project.title}`, engEmailHtml);
    }

    const filesToDelete = project.resources.filter(r => r.type === "FILE" || r.type === "IMAGE");
    if (filesToDelete.length > 0) {
      const deletePromises = filesToDelete.map(file => deleteFile(file.content));
      await Promise.all(deletePromises); 
    }

    return NextResponse.json({ success: true, message: "Project deleted successfully" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}