import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClient } from "@/lib/auth";
import { uploadFile, deleteFile } from "@/lib/uploads";
import { z } from "zod";

export async function GET( req: NextRequest, { params }: { params: Promise<{ projectId: string }> } ) {
  try {
    const { user, error } = await getClient();
    if (error || !user || !user.clientProfile) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        engineer: { include: { user: { select: { name: true, image: true, email: true } } } },
        invitations: {
          include: { engineer: { include: { user: { select: { name: true, image: true, email: true } } } } },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (project.clientId !== user.clientProfile.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const acceptedInvitation = project.invitations.find(inv => inv.status === "ACCEPTED");

    let filteredInvitations = [];

    if (acceptedInvitation) {
      filteredInvitations = [acceptedInvitation];
    } else {
      filteredInvitations = project.invitations.filter( inv => inv.status === "SENT" || inv.status === "EXPIRED" );
    }

    const projectResponse = { ...project, invitations: filteredInvitations };

    return NextResponse.json({ success: true, project: projectResponse }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

const updateProjectSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide a more detailed description"),
  budget: z.number().min(500, "Minimum budget must be ₹500"), 
  instruments: z.array(z.string()).default([]),
  retainedFiles: z.array(z.string()).default([]), 
});

export async function PUT( req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { user, error } = await getClient();
    if (error || !user || !user.clientProfile) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    const existingProject = await prisma.project.findUnique({ where: { id: projectId } });
    if (!existingProject){
        return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (existingProject.clientId !== user.clientProfile.id){
        return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const budget = Number(formData.get("budget"));
    const instrumentsRaw = formData.get("instruments") as string;
    const instruments = instrumentsRaw ? JSON.parse(instrumentsRaw) : [];

    const retainedFilesRaw = formData.get("retainedFiles") as string;
    const retainedFiles: string[] = retainedFilesRaw ? JSON.parse(retainedFilesRaw) : [];

    const validation = updateProjectSchema.safeParse({ title, description, budget, instruments, retainedFiles });
    if (!validation.success){
        return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const filesToDelete = existingProject.roadmapFiles.filter(oldUrl => !retainedFiles.includes(oldUrl));
    for (const fileUrl of filesToDelete) {
      await deleteFile(fileUrl);
    }

    const newFiles = formData.getAll("files") as File[];
    const newFileUrls: string[] = [];
    
    if ((retainedFiles.length + newFiles.length) > 5) {
      return NextResponse.json({ success: false, message: "Maximum 5 files allowed total" }, { status: 400 });
    }

    for (const file of newFiles) {
      if (file.size > 0) {
        const fileUrl = await uploadFile(file, "projects");
        newFileUrls.push(fileUrl);
      }
    }

    const finalFileUrls = [...retainedFiles, ...newFileUrls];

    await prisma.project.update({
      where: { id: projectId },
      data: {
        title: validation.data.title,
        description: validation.data.description,
        budget: validation.data.budget,
        instruments: validation.data.instruments,
        roadmapFiles: finalFileUrls, 
      }
    });

    return NextResponse.json({ success: true, message: "Project updated successfully" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

// export async function DELETE( req: NextRequest, { params }: { params: Promise<{ projectId: string }> } ) {
//   try {
//     const { user, error } = await getClient();
//     if (error || !user || !user.clientProfile) {
//       return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
//     }

//     const { projectId } = await params;

//     const project = await prisma.project.findUnique({ where: { id: projectId } });
//     if (!project){
//         return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
//     }

//     if (project.clientId !== user.clientProfile.id){
//         return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
//     }

//     for (const fileUrl of project.roadmapFiles) {
//       await deleteFile(fileUrl);
//     }

//     await prisma.project.delete({ where: { id: projectId } });

//     return NextResponse.json({ success: true, message: "Project deleted successfully" }, { status: 200 });

//   } catch {
//     return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
//   }
// }
