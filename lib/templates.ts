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

export const projectInvitationTemplate = (name: string, projectTitle: string) => {
  const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/opportunities`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background-color: #fff8e1; color: #f0b31e; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; border: 1px solid #ffe082;">
          New Match Found
        </span>
      </div>
      
      <h2 style="color: #333; text-align: center;">New Project Opportunity!</h2>
      
      <p style="color: #555; font-size: 16px;">Hi <strong>${name}</strong>,</p>
      
      <p style="color: #555; font-size: 16px; line-height: 1.5;">
        Our AI has matched your profile with a new hardware project that fits your skills perfectly. 
      </p>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0; border: 1px border-gray-100;">
        <p style="margin: 0; color: #71717a; font-size: 13px; text-transform: uppercase; font-weight: bold;">Project Title</p>
        <p style="margin: 5px 0 0 0; color: #0f172a; font-size: 18px; font-weight: bold;">${projectTitle}</p>
      </div>
      
      <p style="color: #ef4444; font-size: 14px; font-weight: bold; text-align: center;">
        ⚡ This is a first-come, first-served opportunity!
      </p>

      <div style="margin: 30px 0; text-align: center;">
        <a href="${dashboardUrl}" style="background-color: #f0b31e; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; shadow: 0 4px 6px rgba(240, 179, 30, 0.2);">
          View Project Details
        </a>
      </div>
      
      <p style="color: #777; font-size: 13px; line-height: 1.5; text-align: center;">
        If you're interested, please review and accept the project quickly before another engineer claims it.
      </p>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="color: #bbb; font-size: 12px; text-align: center;">
        Arinova Studio &copy; 2026 • Dedicated Hardware Services
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