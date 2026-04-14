import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const projectId = searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json(
                { success: false, message: "Project ID required" },
                { status: 400 }
            );
        }

        // Fetch all tasks for the project, sorted by date descending
        const tasks = await prisma.projectTask.findMany({
            where: { projectId },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        role: true,
                    },
                },
            },
            orderBy: { date: "desc" },
        });

        return NextResponse.json(
            { success: true, tasks },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/project-tasks error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch tasks" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { title, description, date, projectId } = await req.json();

        if (!title?.trim() || !date || !projectId) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify the user is part of this project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                engineer: { select: { userId: true } },
                client: { select: { userId: true } },
            },
        });

        if (!project) {
            return NextResponse.json(
                { success: false, message: "Project not found" },
                { status: 404 }
            );
        }

        // Check if user is engineer or admin
        const userId = session.user.id;
        const isEngineer = project.engineer?.userId === userId;
        const isClient = project.client?.userId === userId;
        const isAdmin = session.user.role === "ADMIN";

        if (!isEngineer && !isClient && !isAdmin) {
            if (!isEngineer && !isClient) {
                return NextResponse.json(
                    { success: false, message: "Not authorized for this project" },
                    { status: 403 }
                );
            }
        }
        // Create the task
        const task = await prisma.projectTask.create({
            data: {
                title: title.trim(),
                description: description?.trim() || null,
                date: new Date(date),
                projectId,
                createdById: userId,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        role: true,
                    },
                },
            },
        });

        return NextResponse.json(
            { success: true, task },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/project-tasks error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to create task" },
            { status: 500 }
        );
    }
}