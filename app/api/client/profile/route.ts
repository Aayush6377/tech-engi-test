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

    return NextResponse.json({ success: true, profile: user.clientProfile }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

const clientProfileSchema = z.object({
  totalProjects: z.number().int().min(0, "Total projects must be 0 or greater"),
  totalBudget: z.number().min(0, "Total budget must be a positive number"),
  expertise: z.array(z.string()).min(1, "Please provide at least one area of expertise"),
});

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getClient();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = clientProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json( { success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { totalProjects, totalBudget, expertise } = validation.data;

    const profile = await prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: { totalProjects, totalBudget, expertise },
      create: {
        userId: user.id,
        totalProjects,
        totalBudget,
        expertise,
      }
    });

    return NextResponse.json({  success: true, message: "Profile saved successfully", profile }, { status: 200 });

  } catch (err) {
    console.error("[client/profile POST]", err);
    return NextResponse.json({ success: false, message: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}