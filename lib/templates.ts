export const otpTemplate = (otp: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #333;">Verify your email address</h2>
      <p style="color: #555; font-size: 16px;">Thank you for registering! Please use the following One-Time Password (OTP) to verify your email address:</p>
      <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <h1 style="color: #000; letter-spacing: 5px; margin: 0; font-size: 32px;">${otp}</h1>
      </div>
      <p style="color: #777; font-size: 14px;">This code will expire in 10 minutes.</p>
      <p style="color: #777; font-size: 14px;">If you did not request this, please safely ignore this email.</p>
    </div>
  `;
};

export const engineerApprovalTemplate = (name: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #2e7d32;">Congratulations, ${name}!</h2>
      <p style="color: #555; font-size: 16px;">Your engineer profile has been <strong>Approved</strong> by the Admin team.</p>
      <p style="color: #555; font-size: 16px;">You can now log in to your dashboard to view and accept project opportunities.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #f0b31e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
      </div>
      <p style="color: #777; font-size: 14px;">Welcome to the team!</p>
    </div>
  `;
};

export const engineerRejectionTemplate = (name: string, reason: string) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <h2 style="color: #d32f2f;">Update regarding your application</h2>
      <p style="color: #555; font-size: 16px;">Hi ${name}, your engineer profile was not approved at this time.</p>
      <div style="background-color: #fff4f4; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;">
        <p style="color: #d32f2f; margin: 0; font-weight: bold;">Reason for Rejection:</p>
        <p style="color: #333; margin-top: 5px;">${reason || "Information provided was incomplete or invalid."}</p>
      </div>
      <p style="color: #555; font-size: 16px;">You can update your profile and re-submit your documents for another review.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${process.env.NEXTAUTH_URL}/profile" style="background-color: #0f172a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Update Profile</a>
      </div>
    </div>
  `;
};

export const projectInvitationTemplate = (
  name: string,
  projectTitle: string,
  projectDescription: string = "",
  engineerEarnings: number = 0
) => {
  const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/engineer/invitations`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;">
      
      <div style="text-align: center; margin-bottom: 25px;">
        <span style="background-color: #fff8e1; color: #f0b31e; padding: 6px 18px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; border: 1px solid #ffe082;">
          AI MATCH FOUND
        </span>
      </div>
      
      <h2 style="color: #1f2937; text-align: center; margin-bottom: 8px;">New Project Opportunity!</h2>
      <p style="color: #6b7280; text-align: center; font-size: 15px;">This matches your skills perfectly</p>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; margin: 25px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Project Title</p>
        <p style="margin: 0; color: #0f172a; font-size: 20px; font-weight: bold; line-height: 1.3;">${projectTitle}</p>
      </div>

      <div style="background-color: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase;">Description</p>
        <p style="margin: 0; color: #334155; font-size: 15px; line-height: 1.6;">${projectDescription}</p>
      </div>

      <div style="background: linear-gradient(135deg, #f0b31e, #fbbf24); color: white; padding: 18px; border-radius: 10px; text-align: center; margin: 25px 0;">
        <p style="margin: 0 0 4px 0; font-size: 13px; opacity: 0.9;">You will earn</p>
        <p style="margin: 0; font-size: 28px; font-weight: bold;">₹${engineerEarnings.toLocaleString('en-IN')}</p>
      </div>

      <p style="color: #ef4444; font-size: 14px; font-weight: bold; text-align: center; margin: 20px 0;">
        First-come, first-served! Respond quickly.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" 
           style="background-color: #f0b31e; color: white; padding: 15px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(240, 179, 30, 0.3);">
          View & Accept Project
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center;">
        If you're interested, review the full details and accept before someone else takes it.
      </p>
      
      <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 35px 0 20px;" />
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        Arinova Studio © 2026 • Connecting Clients with Top Hardware Engineers
      </p>
    </div>
  `;
};

export const deletionRequestApprovedTemplate = (name: string, projectTitle: string, amount: number, isEngineer: boolean) => `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Project Cancelled</h2>
    <p>Hello ${name},</p>
    <p>The project <b>${projectTitle}</b> has been officially cancelled</p>
    <p>${isEngineer
    ? `As compensation for your time, a payout of <b>₹${amount.toLocaleString("en-IN")}</b> has been added to your ledger and will be processed shortly.`
    : `A refund of <b>₹${amount.toLocaleString("en-IN")}</b> has been added to your ledger and will be processed back to your account shortly.`
  }</p>
  </div>
`;

export const deletionRequestRejectedTemplate = (clientName: string, projectTitle: string) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2 style="color: #f0ad4e;">Project Deletion Request Update</h2>
    <p>Hello ${clientName},</p>
    <p>Your request to delete the project <b>${projectTitle}</b> has been <b>rejected</b> by the administrator.</p>
    <p>The project remains active. If you have ongoing concerns with the engineer or the project scope, please raise a Support Ticket from your dashboard so we can mediate the issue.</p>
    <br/>
    <p>Regards,<br/>The Platform Team</p>
  </div>
`;

export const extensionRequestedTemplate = (clientName: string, projectTitle: string, reason: string, newDate: string) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2 style="color: #0275d8;">Deadline Extension Requested</h2>
    <p>Hello ${clientName},</p>
    <p>The engineer working on your project <b>${projectTitle}</b> has requested a deadline extension.</p>
    <p><b>Requested End Date:</b> ${newDate}</p>
    <p><b>Reason:</b> <i>"${reason}"</i></p>
    <p>Please log in to your dashboard to Approve or Reject this request.</p>
    <br/>
    <p>Regards,<br/>The Platform Team</p>
  </div>
`;

export const extensionReviewedTemplate = (engineerName: string, projectTitle: string, isApproved: boolean) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h2 style="color: ${isApproved ? '#5cb85c' : '#d9534f'};">Deadline Extension ${isApproved ? 'Approved' : 'Rejected'}</h2>
    <p>Hello ${engineerName},</p>
    <p>Your request to extend the deadline for <b>${projectTitle}</b> has been <b>${isApproved ? 'Approved' : 'Rejected'}</b> by the client.</p>
    ${isApproved
    ? '<p>The project timeline has been officially updated.</p>'
    : '<p>The original deadline still stands. If this causes a major issue, please raise a Ticket from your dashboard.</p>'}
    <br/>
    <p>Regards,<br/>The Platform Team</p>
  </div>
`;

export const projectReadyForReviewTemplate = (projectTitle: string, previewLink: string) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h3 style="color: #0275d8;">Your Project is Ready for Review!</h3>
    <p>The engineer has submitted the final work for <b>${projectTitle}</b>.</p>
    <p><b>Preview Link:</b> <a href="${previewLink}" target="_blank" rel="noopener noreferrer">${previewLink}</a></p>
    <p>Please log in to your dashboard to review the work. Once you are satisfied, you can approve it and complete the final payment to unlock your credentials.</p>
    <br/>
    <p>Regards,<br/>The Platform Team</p>
  </div>
`;

export const deletionRequestedClientTemplate = (projectTitle: string, refundAmount: number) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h3 style="color: #d9534f;">Deletion Request Submitted</h3>
    <p>We have received your request to delete the project: <b>${projectTitle}</b>.</p>
    <p>Your request is currently pending admin approval. Please note that if approved, half of your 40% advance payment <b>(₹${refundAmount.toLocaleString("en-IN")})</b> will be refunded to your account in 3-4 working days.</p>
    <br/>
    <p>Regards,<br/>The Platform Team</p>
  </div>
`;

export const deletionRequestedEngineerTemplate = (projectTitle: string, compensationAmount: number) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h3 style="color: #f0ad4e;">Notice: Project Deletion Requested</h3>
    <p>The client has submitted a request to cancel the project: <b>${projectTitle}</b>.</p>
    <p>This request is under review by our Admin team. If the cancellation is approved, the project will be deleted. However, to compensate you for your time and blocked schedule, you will receive a guaranteed payout of <b>₹${compensationAmount.toLocaleString("en-IN")}</b>.</p>
    <p>No further action is required from you at this time.</p>
    <br/>
    <p>Regards,<br/>The Platform Team</p>
  </div>
`;

export const projectCompletedEngineerTemplate = (projectTitle: string, payoutAmount: number) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h3 style="color: #5cb85c;">Project Officially Completed!</h3>
    <p>Congratulations! The client has approved your work for <b>${projectTitle}</b> and successfully completed the final payment.</p>
    <p>Your guaranteed payout of <b>₹${payoutAmount.toLocaleString("en-IN")}</b> has been officially added to our ledger.</p>
    <p>This amount will be processed and transferred to your registered bank account/UPI ID within <b>3-4 working days</b>.</p>
    <br/>
    <p>Thank you for your excellent work!<br/>The Platform Team</p>
  </div>
`;

export const adminActionRequiredTemplate = (type: "REFUND" | "PAYOUT", amount: number, projectTitle: string) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
    <h3 style="color: #d9534f;">Action Required: Pending ${type}</h3>
    <p>A <b>${type}</b> of <b>₹${amount.toLocaleString("en-IN")}</b> has been queued for the project <b>${projectTitle}</b>.</p>
    <p>Please log in to the Admin Financial Dashboard to review, approve, and process this transaction.</p>
    <br/>
    <p>System Automated Message</p>
  </div>
`;

export const refundProcessedTemplate = (projectTitle: string, amount: number) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
    <h3 style="color: #0275d8; border-bottom: 2px solid #f0b31e; padding-bottom: 10px;">Refund Processed Successfully</h3>
    <p>We have successfully processed your partial refund for the canceled project: <b>${projectTitle}</b>.</p>
    <p>An amount of <b style="font-size: 18px; color: #28a745;">₹${amount.toLocaleString("en-IN")}</b> has been initiated back to your original payment method via Razorpay.</p>
    <p style="color: #666; font-size: 14px; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">
      <i>Note: Depending on your bank, it may take 5-7 business days for the funds to reflect in your account statement.</i>
    </p>
    <br/>
    <p>Best regards,<br/><b>The Platform Team</b></p>
  </div>
`;

export const payoutSentTemplate = (projectTitle: string, amount: number) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
    <h3 style="color: #5cb85c; border-bottom: 2px solid #f0b31e; padding-bottom: 10px;">Payout Transferred Successfully! 🎉</h3>
    <p>Great news! Your payout for the project <b>${projectTitle}</b> has been successfully transferred to your registered bank account or UPI ID.</p>
    <p>An amount of <b style="font-size: 18px; color: #28a745;">₹${amount.toLocaleString("en-IN")}</b> has been released from our ledger.</p>
    <p style="color: #666; font-size: 14px;">
      Depending on your bank's processing times, the funds should reflect in your account shortly.
    </p>
    <br/>
    <p>Thank you for your hard work,<br/><b>The Platform Team</b></p>
  </div>
`;

export const payoutDetailsRequiredTemplate = (projectTitle: string, amount: number) => `
  <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #eaeaea; border-radius: 8px;">
    <h3 style="color: #d9534f; border-bottom: 2px solid #f0b31e; padding-bottom: 10px;">Action Required: Missing Payout Details</h3>
    <p>Good news! Your payout of <b style="font-size: 18px; color: #28a745;">₹${amount.toLocaleString("en-IN")}</b> for the project <b>${projectTitle}</b> is ready to be transferred.</p>
    <p>However, we cannot process the transfer because your payout details (Bank Account or UPI) are missing from your profile.</p>
    <p>Please log in to your dashboard and navigate to the <b>Payout Settings</b> to update your information so we can release your funds.</p>
    <br/>
    <p>Best regards,<br/><b>The Platform Team</b></p>
  </div>
`;