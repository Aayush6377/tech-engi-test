import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client"; 
import { getAdmin } from "@/lib/auth";
import { deleteFile } from "@/lib/uploads";
import sendEmail from "@/lib/email";
import { adminActionRequiredTemplate, deletionRequestApprovedTemplate, deletionRequestRejectedTemplate } from "@/lib/templates";
import { z } from "zod";

export async function GET(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { error } = await getAdmin();
    if (error){
        return NextResponse.json({ success: false, message: error }, { status: 403 });
    }

    const { requestId } = await params;

    const request = await prisma.projectCancellationRequest.findUnique({
      where: { id: requestId },
      include: {
        requestedBy: { select: { name: true, email: true, role: true } },
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { user, error } = await getAdmin();
    if (error){
        return NextResponse.json({ success: false, message: error }, { status: 403 });
    }

    const { requestId } = await params;
    const body = await req.json();
    const validation = actionSchema.safeParse(body);
    
    if (!validation.success){
        return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    const cancellationRequest = await prisma.projectCancellationRequest.findUnique({
      where: { id: requestId },
      include: {
        requestedBy: true,
        project: {
          include: {
            client: { include: { user: { select: { name: true, email: true } } } },
            engineer: { include: { user: { select: { name: true, email: true } } } },
            resources: true,
            tickets: true,
            milestones: true,
            kanbanTasks: true,
          }
        }
      }
    });

    if (!cancellationRequest || cancellationRequest.status !== "PENDING") {
      return NextResponse.json({ success: false, message: "Request not found or already processed" }, { status: 404 });
    }

    const project = cancellationRequest.project;
    const clientUser = project.client.user;
    const engineerUser = project.engineer?.user;

    if (validation.data.action === "REJECT") {
      await prisma.projectCancellationRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED" }
      });

      if (cancellationRequest.requestedBy.email) {
        const emailHtml = deletionRequestRejectedTemplate(cancellationRequest.requestedBy.name || "User", project.title);
        await sendEmail(cancellationRequest.requestedBy.email, `Update: Cancellation Request Rejected - ${project.title}`, emailHtml);
      }

      return NextResponse.json({ success: true, message: "Cancellation request rejected" }, { status: 200 });
    }

    const clientRefundAmount = project.budget * 0.20;
    const engineerCompensationAmount = project.budget * 0.10;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.projectCancellationRequest.update({
        where: { id: requestId },
        data: { status: "APPROVED" }
      });

      await tx.project.update({
        where: { id: project.id },
        data: { status: "CANCELED" }
      });

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

    // remove files from storage
    const fileUrlsToDelete: string[] = [];
    
    project.resources.forEach(r => {
      if (r.type === "FILE" || r.type === "IMAGE") fileUrlsToDelete.push(r.content);
    });
    
    project.milestones.forEach(m => {
      if (m.type !== "LINK" && m.content) fileUrlsToDelete.push(m.content);
    });
    
    if (project.kanbanTasks) {
      project.kanbanTasks.forEach(task => {
        if (task.attachments) fileUrlsToDelete.push(...task.attachments);
      });
    }
    
    if (project.tickets) {
      project.tickets.forEach(ticket => {
        if (ticket.images) fileUrlsToDelete.push(...ticket.images);
      });
    }

    // send emails
    const emailPromises = [];

    if (clientUser.email) {
      const clientEmailHtml = deletionRequestApprovedTemplate(clientUser.name || "Client", project.title, clientRefundAmount, false);
      emailPromises.push(sendEmail(clientUser.email, `Project Cancelled: ${project.title}`, clientEmailHtml));
    }

    if (engineerUser && engineerUser.email) {
      const engEmailHtml = deletionRequestApprovedTemplate(engineerUser.name || "Engineer", project.title, engineerCompensationAmount, true);
      emailPromises.push(sendEmail(engineerUser.email, `Project Cancelled: ${project.title}`, engEmailHtml));
    }

    if (user && user.email){
      const adminEmailHtml = adminActionRequiredTemplate("REFUND", clientRefundAmount, project.title);
      emailPromises.push(sendEmail(user.email, `Action Required: Pending Refund`, adminEmailHtml));
    }

    const externalTasks = [];
    
    if (fileUrlsToDelete.length > 0) {
      const deletePromises = fileUrlsToDelete.map(url => deleteFile(url));
      externalTasks.push(...deletePromises);
    }
    
    externalTasks.push(...emailPromises);

    await Promise.allSettled(externalTasks);

    return NextResponse.json({ success: true, message: "Project deleted successfully" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}