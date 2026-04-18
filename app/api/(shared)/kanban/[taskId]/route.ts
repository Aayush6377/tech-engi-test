import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { deleteFile, uploadFile } from "@/lib/uploads";

export async function GET(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    const task = await prisma.kanbanTask.findUnique({
      where: { id: taskId },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        creator: { select: { id: true, name: true, role: true } },
        project: { select: { id: true, title: true } },
        comments: {
          orderBy: { createdAt: "asc" },
          include: { author: { select: { id: true, name: true, image: true, role: true } } }
        },
        reports: {
          orderBy: { createdAt: "desc" },
          include: { reporter: { select: { id: true, name: true } } }
        }
      }
    });

    if (!task){
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, task }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    const formData = await req.formData();

    const existingTask = await prisma.kanbanTask.findUnique({
      where: { id: taskId },
      include: { project: { include: { client: true, engineer: true } } }
    });

    if (!existingTask){
        return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    if (existingTask.creatorId !== user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const assigneeId = formData.get("assigneeId") as string | null;
    const dueDateStr = formData.get("dueDate") as string | null;
    const priority = formData.get("priority") as any || existingTask.priority;
    
    const tagsStr = formData.get("tags") as string | null;
    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : [];

    const retainedAttachments = formData.getAll("retainedAttachments") as string[];
    const newFiles = formData.getAll("files") as File[];

    const filesToDelete = existingTask.attachments.filter(
      (oldFileUrl) => !retainedAttachments.includes(oldFileUrl)
    );

    if (filesToDelete.length > 0) {
      const deletePromises = filesToDelete.map((url) => deleteFile(url));
      await Promise.all(deletePromises);
    }

    let newUploadedUrls: string[] = [];
    if (newFiles.length > 0) {
      const uploadPromises = newFiles.map((file) => uploadFile(file, "kanban"));
      newUploadedUrls = await Promise.all(uploadPromises);
    }

    const finalAttachments = [...retainedAttachments, ...newUploadedUrls];

    await prisma.kanbanTask.update({
      where: { id: taskId },
      data: {
        title: title || existingTask.title,
        description,
        assigneeId: assigneeId || null,
        dueDate: dueDateStr ? new Date(dueDateStr) : undefined,
        priority,
        tags,
        attachments: finalAttachments
      },
      include: { assignee: { select: { name: true, image: true } } }
    });

    return NextResponse.json({ success: true, message: "Task details updated" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;

    const task = await prisma.kanbanTask.findUnique({ where: { id: taskId } });
    if (!task){
        return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    if (task.creatorId !== user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    if (task.attachments && task.attachments.length > 0) {
      const deletePromises = task.attachments.map(url => deleteFile(url));
      await Promise.all(deletePromises);
    }

    await prisma.kanbanTask.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true, message: "Task deleted successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}