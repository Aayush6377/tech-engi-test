import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdmin } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import sendEmail from "@/lib/email";
import { payoutDetailsRequiredTemplate, payoutSentTemplate, refundProcessedTemplate } from "@/lib/templates";

export async function POST(req: NextRequest, { params }: { params: Promise<{ transactionId: string }> }) {
  try {
    const { error } = await getAdmin();
    if (error) {
      return NextResponse.json({ success: false, message: error || "Unauthorized" }, { status: 403 });
    }

    const { transactionId } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { user: { include: { payoutDetail: true } }, project: true }
    });

    if (!transaction){
        return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 });
    }

    if (transaction.status === "SUCCESS"){
        return NextResponse.json({ success: false, message: "Transaction is already processed" }, { status: 400 });
    }

    // refund to client
    if (transaction.type === "REFUND_CLIENT") {
      const advanceTransaction = await prisma.transaction.findFirst({
        where: { projectId: transaction.projectId, type: "ADVANCE_PAYMENT", status: "SUCCESS" }
      });

      if (!advanceTransaction || !advanceTransaction.razorpayPaymentId) {
        return NextResponse.json({ success: false, message: "Original advance payment not found" }, { status: 400 });
      }

      try {
        await razorpay.payments.refund(advanceTransaction.razorpayPaymentId, {
          amount: Math.round(transaction.amount * 100), // 20%
          notes: { reason: "Admin Approved Refund" }
        });
      } catch {
        return NextResponse.json({ success: false, message: "Razorpay refund failed." }, { status: 500 });
      }

      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "SUCCESS" }
      });

      if (transaction.user.email) {
        const emailHtml = refundProcessedTemplate(transaction.project.title, transaction.amount);
        await sendEmail(transaction.user.email, `Refund Processed: ${transaction.project.title}`, emailHtml);
      }

      return NextResponse.json({ success: true, message: "Refund processed successfully" }, { status: 200 });
    }

    // payout to engineer
    if (transaction.type === "PAYOUT_ENGINEER") {

      const payoutDetails = transaction.user.payoutDetail;

      if (!payoutDetails) {
        if (transaction.user.email) {
          const emailHtml = payoutDetailsRequiredTemplate(transaction.project.title, transaction.amount);
          await sendEmail( transaction.user.email, "Action Required: Update Payout Details to Receive Funds", emailHtml);
        }
        return NextResponse.json({ success: false, message: "Engineer has not set up their payout details" }, { status: 400 });
      }

      try {

        const basicAuth = Buffer.from(`${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
        const headers = {
          "Content-Type": "application/json",
          "Authorization": `Basic ${basicAuth}`
        };

        const contactRes = await fetch("https://api.razorpay.com/v1/contacts", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: transaction.user.name || "Engineer",
            email: transaction.user.email,
            reference_id: transaction.user.id,
            type: "vendor"
          })
        });
        
        const contact = await contactRes.json();
        if (!contactRes.ok) throw new Error(`Contact API Error: ${contact.error?.description || "Failed"}`);

        const fundAccountPayload = payoutDetails.upiId 
          ? {
              contact_id: contact.id,
              account_type: "vpa",
              vpa: { address: payoutDetails.upiId }
            }
          : {
              contact_id: contact.id,
              account_type: "bank_account",
              bank_account: {
                name: payoutDetails.accountHolder || transaction.user.name || "Engineer",
                ifsc: payoutDetails.ifscCode,
                account_number: payoutDetails.accountNumber
              }
            };

        const fundAccountRes = await fetch("https://api.razorpay.com/v1/fund_accounts", {
          method: "POST",
          headers,
          body: JSON.stringify(fundAccountPayload)
        });

        const fundAccount = await fundAccountRes.json();
        if (!fundAccountRes.ok) throw new Error(`Fund Account API Error: ${fundAccount.error?.description || "Failed"}`);

        const payoutRes = await fetch("https://api.razorpay.com/v1/payouts", {
          method: "POST",
          headers,
          body: JSON.stringify({
            account_number: process.env.RAZORPAY_X_ACCOUNT_NUMBER!,
            fund_account_id: fundAccount.id,
            amount: Math.round(transaction.amount * 100), // 10%
            currency: "INR",
            mode: payoutDetails.upiId ? "UPI" : "IMPS",
            purpose: "payout",
            queue_if_low_balance: true,
            reference_id: transaction.id
          })
        });

        const payout = await payoutRes.json();
        if (!payoutRes.ok) throw new Error(`Payout API Error: ${payout.error?.description || "Failed"}`);

      } catch (e){
        console.log(e);
        return NextResponse.json({ success: false, message: `Failed to send payout to ${transaction.user.name}` }, { status: 500 });
      }

      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "SUCCESS" }
      });

      if (transaction.user.email) {
        const emailHtml = payoutSentTemplate(transaction.project.title, transaction.amount);
        await sendEmail(transaction.user.email, `Payout Sent: ${transaction.project.title}`, emailHtml);
      }

      return NextResponse.json({ success: true, message: "Payout marked as successful." }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: "Invalid transaction type" }, { status: 400 });

  } catch {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}