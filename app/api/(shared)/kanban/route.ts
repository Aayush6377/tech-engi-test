import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { uploadFile } from "@/lib/uploads";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const searchQuery = searchParams.get("search");

    if (!projectId){
        return NextResponse.json({ success: false, message: "Project ID is required" }, { status: 400 });
    }

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

    if (!isParticipant) {
      return NextResponse.json({ success: false, message: "You do not have access to this project's board." }, { status: 403 });
    }

    const whereClause: any = { projectId };
    
    if (searchQuery && searchQuery.trim() !== "") {
      whereClause.title = { contains: searchQuery.trim(), mode: "insensitive" };
    }

    const tasks = await prisma.kanbanTask.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        assignee: { select: { name: true, image: true } },
        creator: { select: { name: true, role: true } }
      }
    });

    return NextResponse.json({ success: true, tasks }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const projectId = formData.get("projectId") as string;
    const title = formData.get("title") as string;
    
    if (!projectId || !title) {
      return NextResponse.json({ success: false, message: "Project ID and Title are required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { client: true, engineer: true }
    });

    if (!project){
        return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    const isParticipant = (user.role === "CLIENT" && project.client?.userId === user.id) || 
                          (user.role === "ENGINEER" && project.engineer?.userId === user.id);

    if (!isParticipant) {
      return NextResponse.json({ success: false, message: "You are not a participant in this project." }, { status: 403 });
    }

    const description = formData.get("description") as string | null;
    const assigneeId = formData.get("assigneeId") as string | null;
    const dueDateStr = formData.get("dueDate") as string | null;
    const priority = (formData.get("priority") as "LOW" | "MEDIUM" | "HIGH") || "MEDIUM";
    const status = (formData.get("status") as "ON_HOLD" | "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED") || "NOT_STARTED";
    
    const tagsStr = formData.get("tags") as string | null;
    const tags = tagsStr ? tagsStr.split(",").map(t => t.trim()).filter(Boolean) : [];

    const files = formData.getAll("files") as File[];
    let uploadedUrls: string[] = [];
    if (files.length > 0) {
      const uploadPromises = files.map(file => uploadFile(file, "kanban"));
      uploadedUrls = await Promise.all(uploadPromises);
    }

    const task = await prisma.kanbanTask.create({
      data: {
        projectId,
        creatorId: user.id,
        title,
        description,
        assigneeId: assigneeId || null,
        dueDate: dueDateStr ? new Date(dueDateStr) : null,
        priority,
        status,
        tags,
        attachments: uploadedUrls
      },
      include: { assignee: { select: { name: true, image: true } } }
    });

    return NextResponse.json({ success: true, message: "Task created successfully", task }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}