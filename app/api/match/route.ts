import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClient } from "@/lib/auth";
import { getTopMatches } from "@/lib/matcher";
import sendEmail from "@/lib/email";
import { projectInvitationTemplate } from "@/lib/templates";

export async function POST( req: NextRequest ) {
  try {
    const { user, error } = await getClient();
    if (error || !user?.clientProfile) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ success: false, message: "Missing project ID" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (project.clientId !== user.clientProfile.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    if (!project.advancePaid) {
      return NextResponse.json({ success: false, message: "Advance payment required" }, { status: 400 });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "SEARCHING" }
    });

    const topEngineerIds: string[] = await getTopMatches(projectId);

    if (topEngineerIds && topEngineerIds.length > 0) {
      const invitationPromises = topEngineerIds.map(async (engId) => {
        
        await prisma.projectInvitation.create({
            data: {
              projectId: projectId,
              engineerId: engId,
              status: "SENT"
            }
        });

        const engineer = await prisma.engineerProfile.findUnique({
            where: { id: engId },
            include: { user: { select: { email: true, name: true } } }
        });

        if (engineer?.user.email) {
            const emailHtml = projectInvitationTemplate(engineer.user.name || "Engineer", project.title);
            await sendEmail(engineer.user.email, `New Match: ${project.title}`, emailHtml);
        }
      });

      await Promise.all(invitationPromises);
    }

    return NextResponse.json({ success: true, message: "Matching completed" }, { status: 200 });

  } catch (e){
    console.error(e);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}