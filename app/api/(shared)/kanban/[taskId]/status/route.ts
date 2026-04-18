import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { user, error } = await getUser();
    if (error || !user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { taskId } = await params;
    const { status } = await req.json();

    if (!["ON_HOLD", "NOT_STARTED", "IN_PROGRESS", "COMPLETED"].includes(status)) {
      return NextResponse.json({ success: false, message: "Invalid status provided" }, { status: 400 });
    }

    const existingTask = await prisma.kanbanTask.findUnique({
      where: { id: taskId },
      include: { project: { include: { engineer: true } } }
    });

    if (!existingTask){
        return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    const isProjectEngineer = user.role === "ENGINEER" && existingTask.project.engineer?.userId === user.id;
    
    if (user.role !== "ADMIN" && !isProjectEngineer) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const updatedTask = await prisma.kanbanTask.update({
      where: { id: taskId },
      data: { status }
    });

    return NextResponse.json({ success: true, message: "Status updated", task: updatedTask }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}