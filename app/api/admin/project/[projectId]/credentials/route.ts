import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const isAdmin = (session: any): boolean => session?.user?.role === "ADMIN";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId } = await params;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                progress: true,
                isEngineerFinished: true,
                isFinalPaymentMade: true,
                status: true,
                client: { select: { userId: true } },
                engineer: { select: { userId: true } },
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Only client or engineer of this project can view credentials
        const userId = session.user.id;
        const isAdmin = session.user.role === "ADMIN";

        const isParticipant =
            project.client.userId === userId ||
            project.engineer?.userId === userId ||
            isAdmin;

        if (!isParticipant) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Guard: credentials are only accessible when fully unlocked
        const isReviewApproved =
            project.status === "AWAITING_FINAL_PAYMENT" ||
            project.status === "COMPLETED";

        const isUnlocked =
            project.progress === 100 &&
            project.isEngineerFinished &&
            isReviewApproved &&
            project.isFinalPaymentMade;

        if (!isUnlocked) {
            return NextResponse.json({ error: "Credentials are locked" }, { status: 403 });
        }

        // Fetch only CREDENTIALS-type resources that are locked (i.e., credential resources)
        const credentials = await prisma.projectResource.findMany({
            where: {
                projectId: params.projectId,
                type: "CREDENTIALS",
            },
            select: {
                id: true,
                title: true,
                type: true,
                content: true,
                isLocked: true,
                createdAt: true,
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ credentials });
    } catch (error) {
        console.error("[CREDENTIALS_GET]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ projectId: string }> }   // ← Important: Promise type
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ← THIS IS THE FIX
        const { projectId } = await params;

        const { title, content } = await req.json();

        if (!title || !content) {
            return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
        }

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            select: {
                engineer: { select: { userId: true } },
                progress: true,
            },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const userIsAdmin = isAdmin(session);

        const canAdd =
            userIsAdmin ||
            (project.engineer?.userId === session.user.id && project.progress >= 80);

        if (!canAdd) {
            return NextResponse.json({
                error: userIsAdmin
                    ? "Admin permission issue"
                    : "Only the assigned engineer can add credentials at this stage"
            }, { status: 403 });
        }

        const newCredential = await prisma.projectResource.create({
            data: {
                projectId: projectId,
                title: title.trim(),
                type: "CREDENTIALS",
                content: content.trim(),
                isLocked: true,
                addedById: session.user.id,   // Good to track who added it
            },
        });

        return NextResponse.json({
            success: true,
            message: "Credential added successfully",
            credential: newCredential,
        });
    } catch (error: any) {
        console.error("[CREDENTIALS_POST]", error);
        return NextResponse.json({
            error: error.message || "Internal server error"
        }, { status: 500 });
    }
}