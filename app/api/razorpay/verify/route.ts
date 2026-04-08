import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClient } from "@/lib/auth";
import crypto from "crypto";
import sendEmail from "@/lib/email";
import { projectCompletedEngineerTemplate } from "@/lib/templates";

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await getClient();
    if (error || !user?.clientProfile) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 400 });
    }

    // 2. Find the Pending Transaction
    const transaction = await prisma.transaction.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: { 
        project: { 
          include: { engineer: { include: { user: true } } } 
        } 
      }
    });

    if (!transaction || transaction.status !== "PENDING") {
      return NextResponse.json({ success: false, message: "Transaction not found or already processed" }, { status: 404 });
    }

    const project = transaction.project;

    // 3. Process the Database Updates securely in a Prisma Transaction
    await prisma.$transaction(async (tx) => {
      
      // Update the Transaction status
      await tx.transaction.update({
        where: { id: transaction.id },
        data: { 
          status: "SUCCESS",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature
        }
      });

      if (transaction.type === "ADVANCE_PAYMENT") {
        // Advance Payment Logic
        await tx.project.update({
          where: { id: project.id },
          data: { advancePaid: true, status: "SEARCHING" }
        });

      } else if (transaction.type === "FINAL_PAYMENT") {
        // Final Payment Logic
        await tx.project.update({
          where: { id: project.id },
          data: { isFinalPaymentMade: true, status: "COMPLETED" }
        });

        // Unlock all credentials
        await tx.projectResource.updateMany({
          where: { projectId: project.id, isLocked: true },
          data: { isLocked: false }
        });

        // Create PENDING Payout for Engineer (70% of total budget)
        if (project.engineerId) {
          const payoutAmount = project.budget * 0.70;
          await tx.transaction.create({
            data: {
              projectId: project.id,
              userId: project.engineer!.userId,
              amount: payoutAmount,
              type: "PAYOUT_ENGINEER",
              status: "PENDING"
            }
          });
        }
      }
    });

    // 4. Send Email if it was the Final Payment
    if (transaction.type === "FINAL_PAYMENT" && project.engineer?.user.email) {
      const payoutAmount = project.budget * 0.70;
      const engineerEmailHtml = projectCompletedEngineerTemplate(project.title, payoutAmount);
      await sendEmail(project.engineer.user.email, `Project Completed: ${project.title}`, engineerEmailHtml);
    }

    return NextResponse.json({ success: true, message: "Payment verified successfully" }, { status: 200 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}