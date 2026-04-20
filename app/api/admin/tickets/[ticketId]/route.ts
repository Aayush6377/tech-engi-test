import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { deleteFile } from "@/lib/uploads";

export async function GET(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    const { error } = await getAdmin();
    if (error) {
      return NextResponse.json({ success: false, message: error }, { status: 403 });
    }

    const { ticketId } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId, target: "PLATFORM" },
      include: {
        project: {
          select: {
            title: true,
            status: true,
            client: { include: { user: { select: { name: true, email: true } } } },
            engineer: { include: { user: { select: { name: true, email: true } } } }
          }
        },
        raisedBy: { select: { name: true, email: true, role: true } }
      }
    });

    if (!ticket) {
      return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

const updateSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"])
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    const { error } = await getAdmin();
    if (error) {
      return NextResponse.json({ success: false, message: error }, { status: 403 });
    }

    const { ticketId } = await params;
    const body = await req.json();
    
    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    const existingTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!existingTicket) {
      return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: validation.data.status }
    });

    return NextResponse.json({ success: true, message: "Ticket status updated" }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  try {
    const { error } = await getAdmin();
    if (error) {
      return NextResponse.json({ success: false, message: error }, { status: 403 });
    }

    const { ticketId } = await params;

    const existingTicket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!existingTicket) {
      return NextResponse.json({ success: false, message: "Ticket not found" }, { status: 404 });
    }

    if (existingTicket.images && existingTicket.images.length > 0) {
      const deleteImagePromises = existingTicket.images.map((imageUrl) => deleteFile(imageUrl));
      await Promise.all(deleteImagePromises);
    }

    await prisma.ticket.delete({ where: { id: ticketId } });

    return NextResponse.json({ success: true, message: "Ticket deleted successfully" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}