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
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
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