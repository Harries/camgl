import nodemailer from "nodemailer";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === "true"
    : port === 465;
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || (user ? `LiveCam Global <${user}>` : "LiveCam Global <noreply@livecam.global>");

  if (!host || !user || !pass) {
    return null;
  }

  return { host, port, secure, user, pass, from };
}

export function isSmtpConfigured(): boolean {
  return getSmtpConfig() !== null;
}

export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const cfg = getSmtpConfig();
  if (!cfg) {
    console.warn("[mailer] SMTP not configured (missing SMTP_HOST/SMTP_USER/SMTP_PASS); skipping email to", to);
    return { sent: false, reason: "SMTP_NOT_CONFIGURED" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
    });

    await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error("[mailer] Failed to send email:", err);
    return { sent: false, reason: "SEND_FAILED" };
  }
}

export async function sendVerificationCodeEmail({
  to,
  code,
}: {
  to: string;
  code: string;
}) {
  const safeCode = escapeHtml(code);
  return sendMail({
    to,
    subject: `Your LiveCam Global verification code: ${code}`,
    text: `Your LiveCam Global email verification code is: ${code}\n\nThis code expires in 10 minutes. If you did not request this, please ignore this email.\n\n— LiveCam Global`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h2 style="margin: 0 0 12px; color: #1d4ed8;">Verify Your Email</h2>
        <p style="margin: 0 0 16px; line-height: 1.6;">Enter the following 6-digit verification code to complete your LiveCam Global registration:</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; text-align: center; margin: 0 0 18px;">
          <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0f172a; font-family: monospace;">${safeCode}</span>
        </div>
        <p style="margin: 0; font-size: 12px; color: #64748b;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail({
  to,
  name,
  siteUrl,
}: {
  to: string;
  name: string;
  siteUrl: string;
}) {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(siteUrl);
  return sendMail({
    to,
    subject: "Welcome to LiveCam Global",
    text: `Hi ${name},\n\nWelcome to LiveCam Global! Your account has been created successfully.\nYou can now favorite live webcams, submit scenic streams, and manage your personal center at ${siteUrl}/profile.\n\n— LiveCam Global`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h2 style="margin: 0 0 12px; color: #1d4ed8;">Welcome to LiveCam Global</h2>
        <p style="margin: 0 0 12px; line-height: 1.6;">Hi <strong>${safeName}</strong>,</p>
        <p style="margin: 0 0 16px; line-height: 1.6;">Your account has been created successfully. You can now bookmark your favorite live webcams, submit new scenic streams, and manage your Personal Center.</p>
        <p style="margin: 0 0 20px;">
          <a href="${safeUrl}/profile" style="display: inline-block; padding: 10px 18px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Open Personal Center</a>
        </p>
        <p style="margin: 0; font-size: 12px; color: #64748b;">LiveCam Global · Verified Scenic Live Streams</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}) {
  const safeName = escapeHtml(name);
  const safeResetUrl = escapeHtml(resetUrl);
  return sendMail({
    to,
    subject: "Reset your LiveCam Global password",
    text: `Hi ${name},\n\nWe received a request to reset your password on LiveCam Global.\nOpen this link within 30 minutes to set a new password:\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.\n\n— LiveCam Global`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h2 style="margin: 0 0 12px; color: #1d4ed8;">Password Reset Request</h2>
        <p style="margin: 0 0 12px; line-height: 1.6;">Hi <strong>${safeName}</strong>,</p>
        <p style="margin: 0 0 16px; line-height: 1.6;">We received a request to reset your LiveCam Global password. Click the button below within 30 minutes to set a new password:</p>
        <p style="margin: 0 0 20px;">
          <a href="${safeResetUrl}" style="display: inline-block; padding: 10px 18px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
        </p>
        <p style="margin: 0 0 12px; font-size: 12px; color: #475569; word-break: break-all;">Or copy this link: ${safeResetUrl}</p>
        <p style="margin: 0; font-size: 12px; color: #64748b;">If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendSubmissionConfirmationEmail({
  to,
  title,
  location,
  category,
  siteUrl,
}: {
  to: string;
  title: string;
  location: string;
  category: string;
  siteUrl: string;
}) {
  const safeTitle = escapeHtml(title);
  const safeLocation = escapeHtml(location);
  const safeCategory = escapeHtml(category);
  const safeUrl = escapeHtml(siteUrl);
  return sendMail({
    to,
    subject: `Webcam Submission Received: ${title}`,
    text: `Thank you for submitting "${title}" (${location} · ${category}) to LiveCam Global.\n\nOur team will review the stream license, privacy compliance, and playback stability before publishing.\nYou can track your submission status in your Personal Center: ${siteUrl}/profile?tab=webcams\n\n— LiveCam Global`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <h2 style="margin: 0 0 12px; color: #1d4ed8;">Webcam Submission Received</h2>
        <p style="margin: 0 0 12px; line-height: 1.6;">Thank you for submitting a live webcam to LiveCam Global. Our moderation team will review it for licensing, privacy compliance, and playback stability.</p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin: 0 0 18px; font-size: 13px;">
          <div><strong>Title:</strong> ${safeTitle}</div>
          <div style="margin-top: 4px;"><strong>Location:</strong> ${safeLocation}</div>
          <div style="margin-top: 4px;"><strong>Category:</strong> ${safeCategory}</div>
        </div>
        <p style="margin: 0 0 20px;">
          <a href="${safeUrl}/profile?tab=webcams" style="display: inline-block; padding: 10px 18px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">View My Submissions</a>
        </p>
        <p style="margin: 0; font-size: 12px; color: #64748b;">LiveCam Global · Verified Scenic Live Streams</p>
      </div>
    `,
  });
}
