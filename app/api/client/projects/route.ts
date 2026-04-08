import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClient } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  try {
    const { user, error } = await getClient();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    if (!user.clientProfile) {
      return NextResponse.json({ success: false, message: "Please complete your profile first" }, { status: 403 });
    }

    const projects = await prisma.project.findMany({
      where: { clientId: user.clientProfile.id },
      include: {
        engineer: { include: { user: { select: { name: true, image: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, projects }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

const projectSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Please provide a more detailed description"),
  budget: z.number().min(500, "Minimum budget must be ₹500"), 
  instruments: z.array(z.string()).default([]),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getClient();
    if (error || !user?.clientProfile) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json(); 

    const validation = projectSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { title, description, budget, instruments, startDate, endDate } = validation.data;

    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json({ success: false, message: "Start date must be before end date" }, { status: 400 });
    } 

    const newProject = await prisma.project.create({
      data: {
        clientId: user.clientProfile.id,
        title, description, budget, instruments, startDate, endDate,
        status: "AWAITING_ADVANCE"
      }
    });

    return NextResponse.json({ success: true, message: "Project created successfully", projectId: newProject.id }, { status: 201 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}