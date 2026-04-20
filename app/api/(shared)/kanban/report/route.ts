import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { message, taskId } = await req.json();
    if (!message || !taskId){
        return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const existingTask = await prisma.kanbanTask.findUnique({ where: { id: taskId }, include: { project: { include: { client: true, engineer: true } } } });
    if (!existingTask){
        return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    const project = existingTask.project;

    const isParticipant = user.role === "ADMIN" || 
    (user.role === "CLIENT" && project.client?.userId === user.id) ||
    (user.role === "ENGINEER" && project.engineer?.userId === user.id);

    if (!isParticipant) {
      return NextResponse.json({ success: false, message: "You don't have permission to report on this task" }, { status: 403 });
    }

    await prisma.kanbanReport.create({
      data: { message, taskId, reporterId: user.id }
    });

    return NextResponse.json({ success: true, message: "Report created successfully" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { reportId } = await req.json();

    const existingReport = await prisma.kanbanReport.findUnique({ where: { id: reportId } });
    if (!existingReport){
        return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });
    }

    const isParticipant = user.role === "ADMIN" || (existingReport.reporterId !== user.id);

    if (!isParticipant) {
      return NextResponse.json({ success: false, message: "You can only delete your own reports" }, { status: 403 });
    }

    await prisma.kanbanReport.delete({ where: { id: reportId } });

    return NextResponse.json({ success: true, message: "Report deleted successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}