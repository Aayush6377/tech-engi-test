import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEngineer } from "@/lib/auth";
import { z } from "zod";
import sendEmail from "@/lib/email";
import { projectReadyForReviewTemplate } from "@/lib/templates";

const submitSchema = z.object({
  finalProjectLink: z.string().url("Please provide a valid URL for the project preview")
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { user, error } = await getEngineer();
    if (error || !user?.engineerProfile) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await req.json();
    const validation = submitSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ 
      where: { id: projectId },
      include: { client: { include: { user: true } } }
    });

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
      data: { 
        status: "IN_REVIEW",
        isEngineerFinished: true,
        finalProjectLink: validation.data.finalProjectLink,
        progress: 99
      } 
    });

    if (project.client.user.email) {
      const emailHtml = projectReadyForReviewTemplate(project.title, validation.data.finalProjectLink);
      await sendEmail(project.client.user.email, `Project Ready for Review: ${project.title}`, emailHtml);
    }

    return NextResponse.json({ success: true, message: "Project submitted for client review" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server error" }, { status: 500 });
  }
}