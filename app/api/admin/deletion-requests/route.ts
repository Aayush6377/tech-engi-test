import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { error } = await getAdmin();
    if (error){
        return NextResponse.json({ success: false, message: error }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");

    const queryOptions: any = {
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            title: true,
            status: true,
            client: { select: { user: { select: { name: true, email: true } } } },
            engineer: { select: { user: { select: { name: true, email: true } } } }
          }
        }
      }
    };

    if (statusFilter && ["PENDING", "APPROVED", "REJECTED"].includes(statusFilter)) {
      queryOptions.where = { status: statusFilter };
    }

    const requests = await prisma.projectCancellationRequest.findMany(queryOptions);

    return NextResponse.json({ success: true, requests }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}