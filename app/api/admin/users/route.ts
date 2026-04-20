import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await getAdmin();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");
    const searchQuery = searchParams.get("search");

    const whereClause: any = {};
    
    if (roleFilter && ["ADMIN", "ENGINEER", "CLIENT"].includes(roleFilter.toUpperCase())) {
      whereClause.role = roleFilter.toUpperCase();
    }

    if (searchQuery && searchQuery.trim() !== "") {
      whereClause.OR = [
        { name: { contains: searchQuery.trim(), mode: "insensitive" } },
        { email: { contains: searchQuery.trim(), mode: "insensitive" } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: { engineerProfile: true, clientProfile: true },
      orderBy: { lastActiveAt: "desc" },
    });

    const formattedUsers = users.map((u) => {
      const baseData = {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        image: u.image,
        lastActive: u.lastActiveAt,
      };

      if (u.role === "ENGINEER" && u.engineerProfile) {
        return {
          ...baseData,
          status: u.engineerProfile.status,
          employeeId: u.engineerProfile.idNumber,
          joinedAt: u.engineerProfile.createdAt,
          skills: u.engineerProfile.skills,
          completedProjects: u.engineerProfile.completedProjects,
        };
      }

      if (u.role === "CLIENT" && u.clientProfile) {
        return {
          ...baseData,
          totalProjects: u.clientProfile.totalProjects,
          expertise: u.clientProfile.expertise,
        };
      }

      return baseData;
    });

    return NextResponse.json({ success: true, users: formattedUsers }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}