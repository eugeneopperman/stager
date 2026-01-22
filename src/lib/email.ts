import { Resend } from "resend";

// Lazy-initialize Resend client to avoid build-time errors
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Stager <noreply@stager.app>";

interface SendInvitationEmailParams {
  to: string;
  organizationName: string;
  inviterName: string;
  initialCredits: number;
  invitationToken: string;
  expiresAt: Date;
}

export async function sendTeamInvitationEmail({
  to,
  organizationName,
  inviterName,
  initialCredits,
  invitationToken,
  expiresAt,
}: SendInvitationEmailParams) {
  const acceptUrl = `${APP_URL}/invite/accept?token=${invitationToken}`;
  const daysUntilExpiry = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You've been invited to join ${organizationName} on Stager`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Stager</h1>
            <p style="color: #666; margin-top: 5px;">AI-Powered Virtual Staging</p>
          </div>

          <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin-top: 0; color: #1e293b;">You're invited to join a team!</h2>
            <p><strong>${inviterName}</strong> has invited you to join <strong>${organizationName}</strong> on Stager.</p>

            ${initialCredits > 0 ? `
            <div style="background: #ecfdf5; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #065f46;">
                <strong>${initialCredits} staging credits</strong> have been allocated to you.
              </p>
            </div>
            ` : ""}

            <a href="${acceptUrl}" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0;">
              Accept Invitation
            </a>

            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">
              This invitation expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}.
            </p>
          </div>

          <div style="text-align: center; color: #94a3b8; font-size: 12px;">
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
            <p style="margin-top: 20px;">
              <a href="${APP_URL}" style="color: #2563eb; text-decoration: none;">Stager</a> - AI-Powered Virtual Staging for Real Estate
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
You've been invited to join ${organizationName} on Stager!

${inviterName} has invited you to join their team.
${initialCredits > 0 ? `\n${initialCredits} staging credits have been allocated to you.\n` : ""}

Accept your invitation: ${acceptUrl}

This invitation expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""}.

---
If you didn't expect this invitation, you can safely ignore this email.

Stager - AI-Powered Virtual Staging for Real Estate
${APP_URL}
    `.trim(),
  });

  if (error) {
    console.error("Error sending invitation email:", error);
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }

  return data;
}

// Helper to generate a secure invitation token
export function generateInvitationToken(): string {
  // Use crypto.randomUUID for a secure, unique token
  return crypto.randomUUID();
}

// Calculate expiry date (7 days from now)
export function getInvitationExpiryDate(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
}
