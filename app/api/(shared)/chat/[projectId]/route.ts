import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

const MESSAGES_PER_PAGE = 50;

export async function GET(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true, engineer: true }
    });

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    const isParticipant = user.role === "ADMIN" || 
    (user.role === "CLIENT" && project.client?.userId === user.id) ||
    (user.role === "ENGINEER" && project.engineer?.userId === user.id);

    if (!isParticipant) {
      return NextResponse.json({ success: false, message: "You don't have permission to view this project" }, { status: 403 });
    }

    const messages = await prisma.chatMessage.findMany({
      take: MESSAGES_PER_PAGE,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, role: true, image: true } }
      }
    });

    const sortedMessages = messages.reverse();

    const nextCursor = messages.length === MESSAGES_PER_PAGE ? sortedMessages[0].id : null;

    return NextResponse.json({ success: true, messages: sortedMessages, nextCursor: nextCursor }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}