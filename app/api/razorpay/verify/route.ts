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
      return NextResponse.json( { success: false, message: error || "Unauthorized" }, { status: 401 } );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json( { success: false, message: "Invalid payment signature" }, { status: 400 } );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: {
        project: {
          include: { engineer: { include: { user: true } }, client: { include: { user: true } }
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json( { success: false, message: "Transaction not found" }, { status: 404 } );
    }

    if (transaction.status !== "PENDING") {
      return NextResponse.json( { success: false, message: "Transaction already processed" }, { status: 400 } );
    }

    const project = transaction.project;

    await prisma.$transaction(async (tx) => {

      // Mark transaction as successful
      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: "SUCCESS",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          completedAt: new Date(),
        },
      });

      if (transaction.type === "ADVANCE_PAYMENT") {
        await tx.project.update({
          where: { id: project.id },
          data: {
            advancePaid: true,
            status: "SEARCHING",
          },
        });

        // Create payout transaction for engineer if assigned
        if (project.engineerId) {
          const existingPayout = await tx.transaction.findFirst({
            where: {
              projectId: project.id,
              type: "PAYOUT_ENGINEER",
              userId: project.engineer!.userId
            }
          });

          if (!existingPayout) {
            const payoutAmount = project.budget * 0.7;
            await tx.transaction.create({
              data: {
                projectId: project.id,
                userId: project.engineer!.userId,
                amount: payoutAmount,
                type: "PAYOUT_ENGINEER",
                status: "PENDING",
              },
            });
          }
        }

      } else if (transaction.type === "FINAL_PAYMENT") {
        await tx.project.update({
          where: { id: project.id },
          data: {
            isFinalPaymentMade: true,
            status: "COMPLETED",
          },
        });

        // Unlock resources
        await tx.projectResource.updateMany({
          where: { projectId: project.id, isLocked: true },
          data: { isLocked: false },
        });

        // Create or update payout for engineer
        if (project.engineerId) {
          const payoutAmount = project.budget * 0.7;
          
          const existingPayout = await tx.transaction.findFirst({
            where: {
              projectId: project.id,
              type: "PAYOUT_ENGINEER",
              userId: project.engineer!.userId
            }
          });

          if (!existingPayout) {
            await tx.transaction.create({
              data: {
                projectId: project.id,
                userId: project.engineer!.userId,
                amount: payoutAmount,
                type: "PAYOUT_ENGINEER",
                status: "PENDING",
              },
            });
          }
        }
      }
    });

    // Send email to engineer if final payment
    if ( transaction.type === "FINAL_PAYMENT" && project.engineer?.user.email ) {
      const payoutAmount = project.budget * 0.7;
      const engineerEmailHtml = projectCompletedEngineerTemplate(
        project.title,
        payoutAmount
      );

      await sendEmail( project.engineer.user.email, `Project Completed: ${project.title}`, engineerEmailHtml );
    }

    return NextResponse.json( { success: true, message: "Payment verified successfully" }, { status: 200 } );
  } catch {
    return NextResponse.json( { success: false, message: "Internal server error" }, { status: 500 } );
  }
}