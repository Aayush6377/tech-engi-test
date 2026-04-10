import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClient } from "@/lib/auth";
import { z } from "zod";
import { deletionRequestedClientTemplate, deletionRequestedEngineerTemplate } from "@/lib/templates";
import sendEmail from "@/lib/email";

export async function GET( req: NextRequest, { params }: { params: Promise<{ projectId: string }> } ) {
  try {
    const { user, error } = await getClient();
    if (error || !user?.clientProfile) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        engineer: { include: { user: { select: { name: true, image: true, email: true } } } },
        resources: { orderBy: { createdAt: "desc" } },
        cancellationRequests: true,
        invitations: {
          include: { engineer: { include: { user: { select: { name: true, image: true, email: true } } } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!project){ 
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (project.clientId !== user.clientProfile.id){
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const sanitizedResources = project.resources.map(res => {
      if (res.isLocked && !project.isFinalPaymentMade) {
        return { 
          ...res, 
          content: "[LOCKED: Complete the final 60% payment to view these credentials]" 
        };
      }
      return res;
    });

    const acceptedInvitation = project.invitations.find(inv => inv.status === "ACCEPTED");
    const filteredInvitations = acceptedInvitation ? [acceptedInvitation] : project.invitations.filter(inv => inv.status === "SENT" || inv.status === "EXPIRED");

    return NextResponse.json({ 
      success: true, 
      project: { 
        ...project, 
        resources: sanitizedResources,
        invitations: filteredInvitations 
      } 
    }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

const updateProjectSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide a more detailed description"),
  budget: z.number().min(500, "Minimum budget must be ₹500"), 
  instruments: z.array(z.string()).default([]),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export async function PUT( req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { user, error } = await getClient();
    if (error || !user || !user.clientProfile){
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const existingProject = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existingProject){
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (existingProject.clientId !== user.clientProfile.id){
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const validation = updateProjectSchema.safeParse(body);
    
    if (!validation.success){
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { title, description, budget, instruments, startDate, endDate, progress } = validation.data;

    if (existingProject.advancePaid && budget !== existingProject.budget) {
      return NextResponse.json({ success: false, message: "Budget cannot be changed after the advance payment has been made" }, { status: 400 });
    }

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json({ success: false, message: "Start date must be before end date" }, { status: 400 });
    } 

    await prisma.project.update({
      where: { id: projectId },
      data: { title, description, budget, instruments, startDate, endDate, progress }
    });

    return NextResponse.json({ success: true, message: "Project updated successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE( req: NextRequest, { params }: { params: Promise<{ projectId: string }> } ) {
  try {
    const { user, error } = await getClient();
    if (error || !user || !user.clientProfile){
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();
    const { reason } = body;

    const project = await prisma.project.findUnique({ 
      where: { id: projectId }, 
      include: { 
        cancellationRequests: true,
        engineer: { include: { user: true } }
      } 
    });

    if (!project){
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (project.clientId !== user.clientProfile.id){
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    if (project.status === "COMPLETED") {
      return NextResponse.json({ success: false, message: "Project is completed and cannot be canceled." }, { status: 400 });
    }

    const hasPendingRequest = project.cancellationRequests.some(req => req.status === "PENDING" && req.initiator === "CLIENT");
    if (hasPendingRequest) {
      return NextResponse.json({ success: false, message: "A cancellation request is already pending for this project" }, { status: 400 });
    }
    
    if (!reason || reason.length < 10) { 
      return NextResponse.json({ success: false, message: "A valid reason (at least 10 characters) is required to cancel a project" }, { status: 400 });
    }

    await prisma.projectCancellationRequest.create({
      data: { 
        projectId: project.id,
        requestedById: user.id,
        initiator: "CLIENT",
        reason: reason 
      }
    });

    const clientRefundAmount = project.budget * 0.20;
    const engineerCompensationAmount = project.budget * 0.10;

    const clientEmailHtml = deletionRequestedClientTemplate(project.title, clientRefundAmount);
    await sendEmail(user.email, `Project Cancellation Request - ${project.title}`, clientEmailHtml);

    if (project.engineer?.user.email) {
      const engineerEmailHtml = deletionRequestedEngineerTemplate(project.title, engineerCompensationAmount);
      await sendEmail(project.engineer.user.email, `Notice: Cancellation Requested for ${project.title}`, engineerEmailHtml);
    }

    return NextResponse.json({ success: true, message: "Cancellation request sent to admin for review" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}