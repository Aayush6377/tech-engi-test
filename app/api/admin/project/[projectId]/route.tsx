import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

const engineerSelect = {
  id: true,
  userId: true,
  status: true,
  rejectionReason: true,
  qualification: true,
  idType: true,
  idNumber: true,
  idFile: true,
  certifications: true,
  skills: true,
  completedProjects: true,
  createdAt: true,
  // embedding intentionally excluded (unsupported vector type)
  user: { select: { name: true, image: true, email: true } }
} as const;

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }


    const { projectId } = await context.params; const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        client: { include: { user: { select: { name: true, image: true, email: true } } } },
        engineer: { select: engineerSelect },
        resources: { orderBy: { createdAt: "desc" } },
        cancellationRequests: {
          orderBy: { createdAt: "desc" }
        },
        invitations: {
          include: { engineer: { select: engineerSelect } },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, project }, { status: 200 });
  } catch (err) {
    console.error("ADMIN PROJECT ERROR:", err); // ← add this

    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}