import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function PUT( req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, description, date } = await req.json();

    if (!title?.trim() || !date) {
      return NextResponse.json( { success: false, message: "Missing required fields" }, { status: 400 } );
    }

    const task = await prisma.projectTask.findUnique({
      where: { id },
      include: { createdBy: { select: { id: true } } },
    });

    if (!task) {
      return NextResponse.json( { success: false, message: "Task not found" }, { status: 404 } );
    }

    const isParticipant = user.role === "ADMIN" || (task.createdBy.id === user.id);

    if (!isParticipant){
        return NextResponse.json({ success: false, message: "You can only edit your own tasks" }, { status: 403 });
    }

    const createdAt = new Date(task.createdAt);
    const now = new Date();
    const hoursDifference = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursDifference > 24) {
      return NextResponse.json({ success: false, message: "Edit limit expired. Tasks can only be edited within 24 hours of creation.", canEdit: false }, { status: 403 } );
    }

    await prisma.projectTask.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        date: new Date(date),
      }
    });

    return NextResponse.json( { success: true, message: "Task updated successfully" }, { status: 200 } );
  } catch {
    return NextResponse.json( { success: false, message: "Internal server error" }, { status: 500 } );
  }
}

export async function DELETE( req: NextRequest, { params }: { params: Promise<{ id: string }> } ) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.projectTask.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true } },
      },
    });

    if (!task) {
      return NextResponse.json( { success: false, message: "Task not found" }, { status: 404 });
    }

    const isParticipant = user.role === "ADMIN" || (task.createdBy.id === user.id);

    if (!isParticipant){
        return NextResponse.json({ success: false, message: "You can only delete your own tasks" }, { status: 403 });
    }

    await prisma.projectTask.delete({ where: { id } });

    return NextResponse.json( { success: true, message: "Task deleted successfully" }, { status: 200 } );
  } catch {
    return NextResponse.json( { success: false, message: "Internal server error" }, { status: 500 } );
  }
}