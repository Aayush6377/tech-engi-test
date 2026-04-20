import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const { user, error } = await getUser();
        if (error || !user) {
            return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json( { success: false, message: "Project ID required" }, { status: 400 });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { client: true, engineer: true },
        });

        if (!project) {
            return NextResponse.json( { success: false, message: "Project not found" }, { status: 404 });
        }

        const isParticipant = user.role === "ADMIN" || 
        (user.role === "CLIENT" && project.client?.userId === user.id) ||
        (user.role === "ENGINEER" && project.engineer?.userId === user.id);

        if (!isParticipant){
            return NextResponse.json({ success: false, message: "You don't have permission to view this project" }, { status: 403 });
        }

        const tasks = await prisma.projectTask.findMany({
            where: { projectId },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true, image: true, role: true },
                },
            },
            orderBy: { date: "desc" },
        });

        return NextResponse.json( { success: true, tasks }, { status: 200 } );
    } catch {
        return NextResponse.json( { success: false, message: "Internal server error" }, { status: 500 } );
    }
}

export async function POST(req: NextRequest) {
    try {
        const { user, error } = await getUser();
        if (error || !user) {
            return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
        }

        const { title, description, date, projectId } = await req.json();

        if (!title?.trim() || !date || !projectId) {
            return NextResponse.json( { success: false, message: "Missing required fields" }, { status: 400 } );
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                engineer: { select: { userId: true } },
                client: { select: { userId: true } },
            },
        });

        if (!project) {
            return NextResponse.json( { success: false, message: "Project not found" }, { status: 404 } );
        }

        const isParticipant = user.role === "ADMIN" || 
        (user.role === "CLIENT" && project.client?.userId === user.id) ||
        (user.role === "ENGINEER" && project.engineer?.userId === user.id);

        if (!isParticipant){
            return NextResponse.json({ success: false, message: "You don't have permission to add tasks" }, { status: 403 });
        }

        await prisma.projectTask.create({
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                date: new Date(date),
                projectId,
                createdById: user.id,
            },
        });

        return NextResponse.json( { success: true, message: "Task created successfully" }, { status: 201 } );

    } catch {
        return NextResponse.json( { success: false, message: "Internal server error" }, { status: 500 } );
    }
}