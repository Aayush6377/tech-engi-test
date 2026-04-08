import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth"; 
import { uploadImage } from "@/lib/uploads";
import { z } from "zod";

export async function GET() {
  try {
    const { user, error } = await getUser();
    if (error || !user){
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.ticket.findMany({
      where: { raisedById: user.id },
      orderBy: { createdAt: "desc" },
      include: { project: { select: { title: true } } }
    });

    return NextResponse.json({ success: true, tickets }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

const ticketSchema = z.object({
  projectId: z.string(),
  issueType: z.enum(["PAYMENT", "COMMUNICATION", "TECHNICAL", "DELIVERY", "OTHER"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const ticketsRaisedToday = await prisma.ticket.count({
      where: { raisedById: user.id, createdAt: { gte: twentyFourHoursAgo } }
    });

    if (ticketsRaisedToday >= 3) {
      return NextResponse.json({ success: false, message: "You have reached the daily limit of 3 tickets" }, { status: 429 });
    }

    const formData = await req.formData();
    const data = {
      projectId: formData.get("projectId") as string,
      issueType: formData.get("issueType") as string,
      description: formData.get("description") as string,
    };

    const validation = ticketSchema.safeParse(data);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: validation.data.projectId },
      include: { client: true, engineer: true }
    });

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    const isProjectClient = user.role === "CLIENT" && project.client?.userId === user.id;
    const isProjectEngineer = user.role === "ENGINEER" && project.engineer?.userId === user.id;

    if (!isProjectClient && !isProjectEngineer) {
      return NextResponse.json({ success: false, message: "You are not a participant in this project" }, { status: 403 });
    }

    const imageFiles = formData.getAll("images") as File[];
    if (imageFiles.length > 5) {
      return NextResponse.json({ success: false, message: "You can only upload a maximum of 5 images per ticket" }, { status: 400 });
    }

    let uploadedImageUrls: string[] = [];

    if (imageFiles.length > 0) {
      const uploadPromises = imageFiles.map((file) => uploadImage(file, "tickets"));
      uploadedImageUrls = await Promise.all(uploadPromises);
    }

    await prisma.ticket.create({
      data: {
        projectId: validation.data.projectId,
        raisedById: user.id,
        issueType: validation.data.issueType,
        description: validation.data.description,
        images: uploadedImageUrls,
      }
    });

    return NextResponse.json({ success: true, message: "Ticket raised successfully" }, { status: 201 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}