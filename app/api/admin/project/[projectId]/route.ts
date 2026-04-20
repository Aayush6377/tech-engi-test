import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";
import { z } from "zod";
import { deleteFile } from "@/lib/uploads";
import { adminActionRequiredTemplate, adminForceDeletionTemplate, deletionRequestApprovedTemplate } from "@/lib/templates";
import sendEmail from "@/lib/email";

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { error } = await getAdmin();
    if (error) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: { include: { user: { select: { name: true, email: true, image: true, phone: true } } } },
        engineer: { include: { user: { select: { name: true, email: true, image: true, phone: true } } } },
        resources: { orderBy: { createdAt: "desc" } },
        cancellationRequests: { include: { requestedBy: { select: { name: true, role: true } } } },
        invitations: {
          include: { engineer: { include: { user: { select: { name: true, email: true } } } } },
          orderBy: { createdAt: "desc" }
        },
        milestones: true,
        tickets: true
      }
    });

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, project }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

const adminUpdateSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").optional(),
  description: z.string().min(10, "Please provide a more detailed description").optional(),
  budget: z.number().min(500, "Minimum budget must be ₹500").optional(),
  status: z.enum(["SEARCHING", "IN_PROGRESS", "COMPLETED", "CANCELED"]).optional(),
  progress: z.number().min(0).max(100).optional(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  instruments: z.array(z.string()).optional(),
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { error } = await getAdmin();
    if (error) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();

    const validation = adminUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const existingProject = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existingProject) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: validation.data
    });

    return NextResponse.json({ success: true, message: "Project updated successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: { include: { user: true } },
        engineer: { include: { user: true } },
        cancellationRequests: true,
        resources: true,
        milestones: true,
        kanbanTasks: true,
        tickets: true
      }
    });

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    const clientUser = project.client.user;
    const engineerUser = project.engineer?.user;

    const clientRequested = project.cancellationRequests.some(
      req => req.status === "PENDING" && req.initiator === "CLIENT"
    );

    const clientRefundAmount = project.budget * 0.20;
    const engineerCompensationAmount = project.budget * 0.10;

    await prisma.$transaction(async (tx) => {

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

    // delete files
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
      const clientEmailHtml = clientRequested 
        ? deletionRequestApprovedTemplate(clientUser.name || "Client", project.title, clientRefundAmount, false)
        : adminForceDeletionTemplate(clientUser.name || "Client", project.title, clientRefundAmount, false);
        
      emailPromises.push(sendEmail(clientUser.email, `Project Cancelled: ${project.title}`, clientEmailHtml));
    }

    if (engineerUser && engineerUser.email) {
      const engEmailHtml = clientRequested 
        ? deletionRequestApprovedTemplate(engineerUser.name || "Engineer", project.title, engineerCompensationAmount, true)
        : adminForceDeletionTemplate(engineerUser.name || "Engineer", project.title, engineerCompensationAmount, true);
        
      emailPromises.push(sendEmail(engineerUser.email, `Notice: Project Cancelled: ${project.title}`, engEmailHtml));
    }

    if (user.email) {
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