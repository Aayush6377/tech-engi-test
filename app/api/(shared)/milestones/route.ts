import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { uploadFile } from "@/lib/uploads";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ success: false, message: "Project ID is required" }, { status: 400 });
    }

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

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: { addedBy: { select: { name: true, role: true, image: true } } }
    });

    return NextResponse.json({ success: true, milestones }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const projectId = formData.get("projectId") as string;
    const title = formData.get("title") as string;
    const type = formData.get("type") as "IMAGE" | "ZIP" | "DOCUMENT" | "LINK";
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true, engineer: true }
    });

    if (!project){
        return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    const isParticipant = user.role === "ADMIN" || 
    (user.role === "CLIENT" && project.client?.userId === user.id) ||
    (user.role === "ENGINEER" && project.engineer?.userId === user.id);

    if (!isParticipant){
      return NextResponse.json({ success: false, message: "You don't have permission to add a milestone" }, { status: 403 });
    }

    let content = "";

    if (type === "LINK") {
      content = formData.get("content") as string;
      if (!content){
        return NextResponse.json({ success: false, message: "Link URL is required" }, { status: 400 });
      }
    } else {
      const file = formData.get("file") as File;
      if (!file){
        return NextResponse.json({ success: false, message: "File is required" }, { status: 400 });
      }
      
      content = await uploadFile(file, "milestones"); 
    }

    await prisma.milestone.create({
      data: { projectId, addedById: user.id, title, type, content }
    });

    return NextResponse.json({ success: true, message: "Milestone added successfully" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}