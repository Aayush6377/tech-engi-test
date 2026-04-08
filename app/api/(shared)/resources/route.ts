import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { uploadFile } from "@/lib/uploads";
import { z } from "zod";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

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

    const isParticipant = (user.role === "CLIENT" && project.client?.userId === user.id) || (user.role === "ENGINEER" && project.engineer?.userId === user.id);

    if (!isParticipant){
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const resources = await prisma.projectResource.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: { addedBy: { select: { name: true, role: true, image: true } } }
    });

    const sanitizedResources = resources.map(res => {

      if (user.role === "CLIENT" && res.isLocked && !project.isFinalPaymentMade) {
        return { 
          ...res, 
          content: "[LOCKED: Complete the final 60% payment to view these credentials]" 
        };
      }
      return res;
    });

    return NextResponse.json({ success: true, resources: sanitizedResources }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Inernal Server error" }, { status: 500 });
  }
}

const createResourceSchema = z.object({
  projectId: z.string(),
  title: z.string().min(2, "Title is required"),
  type: z.enum(["FILE", "CREDENTIALS", "IMAGE", "LINK", "TEXT"]),
});


export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const data = {
      projectId: formData.get("projectId") as string,
      title: formData.get("title") as string,
      type: formData.get("type") as any,
    };

    const validation = createResourceSchema.safeParse(data);
    if (!validation.success){
        return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: validation.data.projectId },
      include: { client: true, engineer: true }
    });

    if (!project){
        return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    const isParticipant = (user.role === "CLIENT" && project.client?.userId === user.id) || (user.role === "ENGINEER" && project.engineer?.userId === user.id);

    if (!isParticipant){
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    let finalContent = "";

    if (validation.data.type === "FILE" || validation.data.type === "IMAGE") {
      const file = formData.get("file") as File;
      if (!file || file.size === 0){
        return NextResponse.json({ success: false, message: "File is required" }, { status: 400 });
      }
      finalContent = await uploadFile(file, "resources");

    } else {
      const textContent = formData.get("content") as string;
      if (!textContent){
        return NextResponse.json({ success: false, message: "Content is required" }, { status: 400 });
      }
      finalContent = textContent;
    }

    const newResource = await prisma.projectResource.create({
      data: {
        projectId: validation.data.projectId,
        addedById: user.id,
        title: validation.data.title,
        type: validation.data.type,
        content: finalContent,
        isLocked: validation.data.type === "CREDENTIALS"
      }
    });

    return NextResponse.json({ success: true, message: "Resource added successfully", resource: newResource }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Inernal Server error" }, { status: 500 });
  }
}