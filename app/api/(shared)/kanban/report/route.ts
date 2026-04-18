import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { message, taskId } = await req.json();
    if (!message || !taskId){
        return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    await prisma.kanbanReport.create({
      data: { message, taskId, reporterId: user.id }
    });

    return NextResponse.json({ success: true, message: "Report created successfully" }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user){
        return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { reportId } = await req.json();

    const existingReport = await prisma.kanbanReport.findUnique({ where: { id: reportId } });
    if (!existingReport){
        return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });
    }

    if (existingReport.reporterId !== user.id) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    await prisma.kanbanReport.delete({ where: { id: reportId } });

    return NextResponse.json({ success: true, message: "Report deleted successfully" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}