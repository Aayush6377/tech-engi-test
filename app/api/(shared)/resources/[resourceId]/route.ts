import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { uploadFile, deleteFile } from "@/lib/uploads";

export async function GET(req: NextRequest, { params }: { params: Promise<{ resourceId: string }> }) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { resourceId } = await params;

    const resource = await prisma.projectResource.findUnique({
      where: { id: resourceId },
      include: { 
        project: true, 
        addedBy: { select: { name: true, role: true, image: true } } 
      }
    });

    if (!resource){
        return NextResponse.json({ success: false, message: "Resource not found" }, { status: 404 });
    }

    const project = resource.project;

    const isParticipant =  user.role === "ADMIN" || 
    (user.role === "CLIENT" && project.clientId === user.clientProfile?.id) || 
    (user.role === "ENGINEER" && project.engineerId === user.engineerProfile?.id);

    if (!isParticipant){
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    let finalContent = resource.content;

    if (user.role === "CLIENT" && resource.isLocked && !project.isFinalPaymentMade) {
       finalContent = "[LOCKED: Complete the final 60% payment to view these credentials]";
    }

    const { project: _, ...resourceData } = resource;

    return NextResponse.json({ success: true, resource: { ...resourceData, content: finalContent } }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ resourceId: string }> }) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { resourceId } = await params;
    const existingResource = await prisma.projectResource.findUnique({ where: { id: resourceId } });

    if (!existingResource){
        return NextResponse.json({ success: false, message: "Resource not found" }, { status: 404 });
    }

    const isParticipant =  user.role === "ADMIN" || (existingResource.addedById !== user.id);

    if (!isParticipant){
      return NextResponse.json({ success: false, message: "You can only edit your own resources" }, { status: 403 });
    }

    const formData = await req.formData();
    const newTitle = formData.get("title") as string | null;
    const requestedType = formData.get("type") as any | null; 
    
    const newType = requestedType || existingResource.type;
    let newContent = existingResource.content;

    const isOldTypeFile = existingResource.type === "FILE" || existingResource.type === "IMAGE";
    const isNewTypeFile = newType === "FILE" || newType === "IMAGE";

    if (isOldTypeFile && !isNewTypeFile) {
      await deleteFile(existingResource.content);
      newContent = formData.get("content") as string;
      if (!newContent) return NextResponse.json({ success: false, message: "Text content is required" }, { status: 400 });

    } else if (!isOldTypeFile && isNewTypeFile) {
      const newFile = formData.get("file") as File;
      if (!newFile || newFile.size === 0) return NextResponse.json({ success: false, message: "File is required" }, { status: 400 });
      newContent = await uploadFile(newFile, "resources");

    } else if (isOldTypeFile && isNewTypeFile) {
      const newFile = formData.get("file") as File;
      if (newFile && newFile.size > 0) {
        await deleteFile(existingResource.content);
        newContent = await uploadFile(newFile, "resources");
      }
    } else {
      const updatedContent = formData.get("content") as string;
      if (updatedContent) newContent = updatedContent;
    }

    const updatedResource = await prisma.projectResource.update({
      where: { id: resourceId },
      data: {
        title: newTitle || existingResource.title,
        type: newType,
        content: newContent,
        isLocked: newType === "CREDENTIALS"
      }
    });

    return NextResponse.json({ success: true, message: "Resource updated", resource: updatedResource }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ resourceId: string }> }) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { resourceId } = await params;
    const existingResource = await prisma.projectResource.findUnique({ where: { id: resourceId } });

    if (!existingResource){
        return NextResponse.json({ success: false, message: "Resource not found" }, { status: 404 });
    }

    const isParticipant =  user.role === "ADMIN" || (existingResource.addedById !== user.id);

    if (!isParticipant){
      return NextResponse.json({ success: false, message: "You can only delete your own resources" }, { status: 403 });
    }

    if (existingResource.type === "FILE" || existingResource.type === "IMAGE") {
      await deleteFile(existingResource.content);
    }

    await prisma.projectResource.delete({ where: { id: resourceId } });

    return NextResponse.json({ success: true, message: "Resource deleted successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal Server error" }, { status: 500 });
  }
}