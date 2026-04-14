import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { title, description, date } = await req.json();

    if (!title?.trim() || !date) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the task
    const task = await prisma.projectTask.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true } } },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === "ADMIN";

    // Only the creator can edit
    if (task.createdById !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Only the creator can edit this task" },
        { status: 403 }
      );
    }

    // Check 24-hour edit limit
    const createdAt = new Date(task.createdAt);
    const now = new Date();
    const hoursDifference = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDifference > 24) {
      return NextResponse.json(
        {
          success: false,
          message: "Edit limit expired. Tasks can only be edited within 24 hours of creation.",
          canEdit: false,
        },
        { status: 403 }
      );
    }

    // Update the task
    const updatedTask = await prisma.projectTask.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        date: new Date(date),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, task: updatedTask },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/project-tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get the task
    const task = await prisma.projectTask.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true } },
        project: {
          include: {
            engineer: { select: { userId: true } },
            client: { select: { userId: true } },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    // Only creator or project admin can delete
    const isCreator = task.createdById === session.user.id;
    const isEngineer = task.project.engineer?.userId === session.user.id;
    const isClient = task.project.client?.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";
    
    if (!isCreator && !(isEngineer || isClient) && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Not authorized to delete this task" },
        { status: 403 }
      );
    }

    // Delete the task
    await prisma.projectTask.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Task deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/project-tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete task" },
      { status: 500 }
    );
  }
}