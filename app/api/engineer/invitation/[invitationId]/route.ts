import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEngineer } from "@/lib/auth";
import { z } from "zod";

export async function GET( req: NextRequest, { params }: { params: Promise<{ invitationId: string }> } ) {
  try {
    const { invitationId } = await params;
    const { user, error } = await getEngineer(true);

    if (error || !user?.engineerProfile) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 403 });
    }

    const invitation = await prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            description: true,
            budget: true, 
            instruments: true,
            resources: true, 
            createdAt: true,
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ success: false, message: "Invitation not found" }, { status: 404 });
    }

    if (invitation.engineerId !== user.engineerProfile.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    
    const { budget, ...safeProject } = invitation.project;
    
    const updatedInvitation = {
      ...invitation,
      project: {
        ...safeProject,
        earnings: budget * 0.7,
        currency: "INR"
      }
    };

    return NextResponse.json({ success: true, invitation: updatedInvitation }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

const responseSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"]),
});

export async function PATCH( req: NextRequest, { params }: { params: Promise<{ invitationId: string }> } ) {
  try {
    const { invitationId } = await params;
    const { user, error } = await getEngineer(true);

    if (error || !user?.engineerProfile) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const validation = responseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { action } = validation.data;

    const invitation = await prisma.projectInvitation.findUnique({
      where: { id: invitationId },
      include: { project: true }
    });
      
    if (!invitation){
      return NextResponse.json({ success: false, message: "Invitation not found" }, { status: 404 });
    }

    if (invitation.engineerId !== user.engineerProfile.id){
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    if (invitation.status !== "SENT"){
      return NextResponse.json({ success: false, message: "This invitation is no longer valid" }, { status: 400 });
    }

    if (action === "REJECT") {
      await prisma.projectInvitation.update({
        where: { id: invitationId },
        data: { status: "REJECTED" }
      });

      return NextResponse.json({ success: true, message: "Invitation rejected" }, { status: 200 });
    }

    const activeProject = await prisma.project.findFirst({
      where: { engineerId: user.engineerProfile.id, status: { in: ["IN_PROGRESS", "IN_REVIEW"] } }
    });

    if (activeProject) {
      return NextResponse.json({ success: false, message: "You cannot accept this invitation because you are already working on an active project" }, { status: 400 });
    }

    if (invitation.project.status !== "SEARCHING" || invitation.project.engineerId !== null) {
      return NextResponse.json({ success: false, message: "This project is no longer available" }, { status: 400 });
    }

    // update project status
    await prisma.project.update({
        where: { id: invitation.projectId },
        data: {
            engineerId: user.engineerProfile!.id,
            status: "IN_PROGRESS"
        }
    });

    // accept the invitation
    await prisma.projectInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" }
    });

    // expire other invitations
    await prisma.projectInvitation.updateMany({
        where: {
            projectId: invitation.projectId,
            id: { not: invitationId },
            status: "SENT"
        },
        data: { status: "EXPIRED" }
    });

    return NextResponse.json({ success: true, message: "Project accepted successfully!" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}