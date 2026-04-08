import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClient } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { user, error } = await getClient();
    if (error || !user?.clientProfile) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (project.clientId !== user.clientProfile.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    if (project.status !== "IN_REVIEW" || !project.engineerId) {
      return NextResponse.json({ success: false, message: "Project is not ready to be completed" }, { status: 400 });
    }

    await prisma.project.update({
        where: { id: projectId },
        data: { 
          status: "AWAITING_FINAL_PAYMENT",
          progress: 100 
        }
    });

    await prisma.engineerProfile.update({
        where: { id: project.engineerId },
        data: { completedProjects: { increment: 1 } }
    });

    return NextResponse.json({ success: true, message: "Project completed successfully!" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server error" }, { status: 500 });
  }
}