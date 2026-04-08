import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClient } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getClient();
    if (error || !user?.clientProfile) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await req.json();
    if (!projectId){
      return NextResponse.json({ success: false, message: "Project ID required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.clientId !== user.clientProfile.id) {
      return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 });
    }

    if (project.isFinalPaymentMade) {
      return NextResponse.json({ success: false, message: "Project is already fully paid" }, { status: 400 });
    }

    const isAdvance = !project.advancePaid;
    const amountToPay = isAdvance ? project.budget * 0.40 : project.budget * 0.60;
    const transactionType = isAdvance ? "ADVANCE_PAYMENT" : "FINAL_PAYMENT";


    const order = await razorpay.orders.create({
      amount: Math.round(amountToPay * 100),
      currency: "INR",
      receipt: `receipt_${projectId}_${Date.now()}`
    });

    await prisma.transaction.create({
      data: {
        projectId: project.id,
        userId: user.id,
        amount: amountToPay,
        type: transactionType,
        status: "PENDING",
        razorpayOrderId: order.id
      }
    });

    return NextResponse.json({ success: true, order }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}