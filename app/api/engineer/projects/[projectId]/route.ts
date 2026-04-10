import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEngineer } from "@/lib/auth";
import z from "zod";

export async function GET( req: NextRequest, { params }: { params: Promise<{ projectId: string }> } ) {
  try {
    const { user, error } = await getEngineer();
    if (error || !user?.engineerProfile) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { resources: { orderBy: { createdAt: "desc" } } }
    });

    if (!project){ 
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (project.engineerId !== user.engineerProfile.id){
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { budget, ...projectData } = project;

    return NextResponse.json({ success: true, project: { ...projectData, earnings: budget * 0.7 } }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

const progressSchema = z.object({
  progress: z.number().min(0, "Progress cannot be less than 0").max(99, "Only the client can mark the project as 100% complete")
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { user, error } = await getEngineer();
    if (error || !user?.engineerProfile) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();
    const validation = progressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project){
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (project.engineerId !== user.engineerProfile.id){
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    if (project.status !== "IN_PROGRESS"){
      return NextResponse.json({ success: false, message: "Project is not in progress" }, { status: 400 });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { progress: validation.data.progress }
    });

    return NextResponse.json({ success: true, message: "Progress updated successfully" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE( req: NextRequest, { params }: { params: Promise<{ projectId: string }> } ) {
  try {
    const { user, error } = await getEngineer();
    if (error || !user || !user.engineerProfile){
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();
    const { reason } = body;

    const project = await prisma.project.findUnique({ 
      where: { id: projectId }, 
      include: { 
        cancellationRequests: true,
        client: { include: { user: true } }
      } 
    });

    if (!project){
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (project.engineerId !== user.engineerProfile.id){
      return NextResponse.json({ success: false, message: "You are not assigned to this project" }, { status: 403 });
    }

    if (project.status === "COMPLETED" || project.status === "CANCELED") {
      return NextResponse.json({ success: false, message: `Project is already ${project.status.toLowerCase()} and cannot be dropped` }, { status: 400 });
    }

    const hasPendingRequest = project.cancellationRequests.some(req => req.status === "PENDING");
    if (hasPendingRequest) {
      return NextResponse.json({ success: false, message: "A request is already pending for this project" }, { status: 400 });
    }
    
    if (!reason || reason.length < 10) { 
      return NextResponse.json({ success: false, message: "A valid reason (at least 10 characters) is required to drop a project" }, { status: 400 });
    }

    await prisma.projectCancellationRequest.create({
      data: { 
        projectId: project.id,
        requestedById: user.id,
        initiator: "ENGINEER",
        reason: reason 
      }
    });

    return NextResponse.json({ success: true, message: "Drop request sent to admin for review" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}