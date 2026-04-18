import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { content, taskId } = await req.json();
    if (!content || !taskId){
        return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    await prisma.kanbanComment.create({
      data: { content, taskId, authorId: user.id },
    });

    return NextResponse.json({ success: true, message: "Comment created successfully" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { commentId, content } = await req.json();

    const existingComment = await prisma.kanbanComment.findUnique({ where: { id: commentId } });
    if (!existingComment){
        return NextResponse.json({ success: false, message: "Comment not found" }, { status: 404 });
    }

    if (existingComment.authorId !== user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await prisma.kanbanComment.update({
      where: { id: commentId },
      data: { content }
    });

    return NextResponse.json({ success: true, message: "Comment updated successfully" }, { status: 200 });
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

    const { commentId } = await req.json();

    const existingComment = await prisma.kanbanComment.findUnique({ where: { id: commentId } });
    if (!existingComment){
        return NextResponse.json({ success: false, message: "Comment not found" }, { status: 404 });
    }

    if (existingComment.authorId !== user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await prisma.kanbanComment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true, message: "Comment deleted successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}