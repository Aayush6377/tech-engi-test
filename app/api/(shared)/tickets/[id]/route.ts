import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { status } = await req.json();
    const ticket = await prisma.ticket.findUnique({
      where: { id: id },
      include: { project: { include: { client: true, engineer: true } } },
    });

    if (!ticket) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }
    const project = ticket.project;
    const isProjectClient =
      user.role === "CLIENT" && project.client?.userId === user.id;
    const isProjectEngineer =
      user.role === "ENGINEER" && project.engineer?.userId === user.id;

    await prisma.ticket.update({
      where: { id: id },
      data: { status },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Failed to update status" },
      { status: 500 }
    );
  }
}
