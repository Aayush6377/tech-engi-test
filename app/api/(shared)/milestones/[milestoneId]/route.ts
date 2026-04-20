import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { deleteFile, uploadFile } from "@/lib/uploads";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ milestoneId: string }> }) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { milestoneId } = await params;
    const formData = await req.formData();
    
    const title = formData.get("title") as string;
    const type = formData.get("type") as "IMAGE" | "ZIP" | "DOCUMENT" | "LINK";
    const completed = formData.get("completed")==="true" ? true:false;
    const existingMilestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!existingMilestone) {
      return NextResponse.json({ success: false, message: "Milestone not found" }, { status: 404 });
    }

    const isParticipant = user.role === "ADMIN" || (existingMilestone.addedById !== user.id);

    if (!isParticipant) {
      return NextResponse.json({ success: false, message: "You can only update your own milestones" }, { status: 403 });
    }

    let content = existingMilestone.content;

    if (type === "LINK") {
      const newLink = formData.get("content") as string;
      if (newLink) content = newLink;
    } else if(type) {
      const file = formData.get("file") as File;
      if (file && file.size > 0) {
        if (existingMilestone.type !== "LINK" && existingMilestone.content) {
          await deleteFile(existingMilestone.content);
        }
        content = await uploadFile(file, "milestones"); 
      }
    }
    const data: any = {};
    if(title){
      data.title = title;
    }
    if(type){
      data.type = type;
    }
    if(content){
      data.content = content;
    }
    if(completed){
      data.completed = completed
    }
    await prisma.milestone.update({
      where: { id: milestoneId },
      data: data
    });

    return NextResponse.json({ success: true, message: "Milestone updated" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ milestoneId: string }> }) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { milestoneId } = await params;

    const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone) {
      return NextResponse.json({ success: false, message: "Milestone not found" }, { status: 404 });
    }

    const isParticipant = user.role === "ADMIN" || (milestone.addedById !== user.id);

    if (!isParticipant) {
      return NextResponse.json({ success: false, message: "You can only delete your own milestones" }, { status: 403 });
    }

    if (milestone.type !== "LINK" && milestone.content) {
      await deleteFile(milestone.content);
    }

    await prisma.milestone.delete({ where: { id: milestoneId } });

    return NextResponse.json({ success: true, message: "Milestone deleted successfully" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}