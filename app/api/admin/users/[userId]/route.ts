import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";
import { deleteFile } from "@/lib/uploads";
import { z } from "zod";
import { generateEmbedding } from "@/lib/embeddings";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { error } = await getAdmin();
    if (error){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    const userDetails = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        engineerProfile: true,
        clientProfile: true
      }
    });

    if (!userDetails){
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: userDetails }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

const updateUserSchema = z.object({
  name: z.string().optional(),
  expertise: z.array(z.string()).optional(), //client only
  skills: z.array(z.string()).optional(), //engineer only
  qualification: z.enum(["UG", "EMPLOYED", "UNEMPLOYED"]).optional(), // engineer only
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(), //engineer only
  rejectionReason: z.string().optional().nullable() //engineer only
});

export async function PUT(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { error } = await getAdmin();
    if (error){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const body = await req.json();

    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { name, expertise, skills, qualification, approvalStatus, rejectionReason } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { engineerProfile: true, clientProfile: true }
    });

    if (!existingUser){
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }


    await prisma.user.update({ where: { id: userId }, data: { name } });

    if (existingUser.role === "CLIENT" && expertise) {
        await prisma.clientProfile.upsert({
            where: { userId: userId },
            update: { expertise },
            create: { userId: userId, expertise 
            }
        });
    }

    if (existingUser.role === "ENGINEER") {
        await prisma.engineerProfile.upsert({
            where: { userId: userId },
            update: { 
                skills, 
                qualification, 
                status: approvalStatus, 
                rejectionReason 
            },
            create: {
                userId: userId,
                skills: skills || [],
                qualification: qualification || "UG",
                status: approvalStatus || "PENDING",
                rejectionReason: rejectionReason || null,
                idType: "AADHAAR", 
                idNumber: "ADMIN_UPSERTED",
                idFile: "ADMIN_UPSERTED",
                certifications: []
            }
        });

        if (skills && skills.length > 0){
          generateEmbedding(`Skills: ${skills.join(", ")}`)
          .then((embeddingVector) => {
            const vectorString = JSON.stringify(embeddingVector);
            return prisma.$executeRaw`
              UPDATE "EngineerProfile"
              SET embedding = ${vectorString}::vector
              WHERE "userId" = ${userId};
            `;
          })
          .catch((err) => console.error("[embedding PUT]", err));
        }
    }

    return NextResponse.json({ success: true, message: "User updated successfully" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { error } = await getAdmin();
    if (error){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
      include: { engineerProfile: true, clientProfile: true, addedResources: true, milestones: true, createdKanbanTasks: true }
    });

    if (!userToDelete){
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // delete all associated files
    const filesToDelete: string[] = [];

    if (userToDelete.image) filesToDelete.push(userToDelete.image);

    if (userToDelete.role === "ENGINEER" && userToDelete.engineerProfile?.idFile) {
      filesToDelete.push(userToDelete.engineerProfile.idFile);
    }

    if (userToDelete.addedResources.length > 0) {
      userToDelete.addedResources.forEach(res => {
        if (res.type === "FILE" || res.type === "IMAGE") {
          filesToDelete.push(res.content);
        }
      });
    }

    if (userToDelete.milestones.length > 0) {
      userToDelete.milestones.forEach(m => {
        if (m.type !== "LINK" && m.content) filesToDelete.push(m.content);
      });
    }

    if (userToDelete.createdKanbanTasks.length > 0) {
      userToDelete.createdKanbanTasks.forEach(t => {
        if (t.attachments && t.attachments.length > 0) filesToDelete.push(...t.attachments);
      });
    }

    if (filesToDelete.length > 0) {
      await Promise.all(filesToDelete.map(url => deleteFile(url)));
    }

    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true, message: "User and all associated data permanently deleted" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}