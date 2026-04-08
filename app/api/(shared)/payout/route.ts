import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { z } from "zod";

export async function GET() {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const payoutDetails = await prisma.payoutDetail.findUnique({ where: { userId: user.id } });

    return NextResponse.json({ success: true, payoutDetails }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server error" }, { status: 500 });
  }
}

const payoutSchema = z.object({
  upiId: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  ifscCode: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  accountHolder: z.string().optional().nullable(),
}).refine(data => data.upiId || (data.accountNumber && data.ifscCode), {
  message: "You must provide either a valid UPI ID, or complete Bank Account details."
});

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getUser();
    if (error || !user) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = payoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, message: validation.error.issues[0].message }, { status: 400 });
    }

    const { upiId, accountNumber, ifscCode, bankName, accountHolder } = validation.data;

    await prisma.payoutDetail.upsert({
      where: { userId: user.id },
      update: { upiId, accountNumber, ifscCode, bankName, accountHolder },
      create: { userId: user.id, upiId, accountNumber, ifscCode, bankName, accountHolder }
    });

    return NextResponse.json({ success: true, message: "Payment details saved successfully" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server error" }, { status: 500 });
  }
}