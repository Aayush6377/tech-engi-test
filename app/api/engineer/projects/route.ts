import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "ENGINEER") {
      return NextResponse.json({ success: false, message: "Engineer access required" }, { status: 403 });
    }

    if (!user.engineerProfile) {
      return NextResponse.json({ success: true, projects: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0 }, globalStats: { total: 0, active: 0, completed: 0 } }, { status: 200 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;

    const engineerId = user.engineerProfile.id;

    const whereClause: any = { engineerId };

    if (status !== "ALL") {
      whereClause.status = status;
    }

    if (search.trim() !== "") {
      whereClause.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const [ assignedProjects, totalFilteredCount, totalProjects, activeProjects, completedProjects ] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.project.count({ where: whereClause }),
      prisma.project.count({ where: { engineerId } }),
      prisma.project.count({ where: { engineerId, status: { in: ["IN_PROGRESS", "IN_REVIEW", "AWAITING_FINAL_PAYMENT"] } } }),
      prisma.project.count({ where: { engineerId, status: "COMPLETED" } })
    ]);

    const projectsWithEarnings = assignedProjects.map((project) => {
      const { budget, ...publicProjectData } = project;
      const engineerEarnings = budget * 0.7;
      return { ...publicProjectData, earnings: engineerEarnings };
    });

    return NextResponse.json({ 
      success: true, 
      projects: projectsWithEarnings,
      pagination: {
        total: totalFilteredCount,
        page,
        limit,
        totalPages: Math.ceil(totalFilteredCount / limit)
      },
      globalStats: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects
      }
    }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}