import nodemailer, { type Transporter } from "nodemailer";
import type { SendMailOptions } from "nodemailer";
import { getConfig } from "../config/app-config.js";

interface EmailConfig {
    enabled: boolean;
    provider: "smtp" | "sendgrid" | "mailgun";
    from: string;
    smtp?: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        pass: string;
    };
    sendgrid?: {
        apiKey: string;
    };
    mailgun?: {
        apiKey: string;
        domain: string;
    };
}

let transporter: Transporter | null = null;

function getEmailConfig(): EmailConfig {
    return {
        enabled: process.env.EMAIL_ENABLED === "true",
        provider: (process.env.EMAIL_PROVIDER as any) || "smtp",
        from: process.env.EMAIL_FROM || "GitTic <noreply@gittic.io>",
        smtp: {
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: process.env.SMTP_SECURE === "true",
            user: process.env.SMTP_USER || "",
            pass: process.env.SMTP_PASS || "",
        },
        sendgrid: {
            apiKey: process.env.SENDGRID_API_KEY || "",
        },
        mailgun: {
            apiKey: process.env.MAILGUN_API_KEY || "",
            domain: process.env.MAILGUN_DOMAIN || "",
        },
    };
}

export function initializeEmailService(): void {
    const config = getEmailConfig();

    if (!config.enabled) {
        console.log("[email] Email service is disabled");
        return;
    }

    if (config.provider === "smtp") {
        transporter = nodemailer.createTransport({
            host: config.smtp!.host,
            port: config.smtp!.port,
            secure: config.smtp!.secure,
            auth: {
                user: config.smtp!.user,
                pass: config.smtp!.pass,
            },
        });
        console.log(`[email] Initialized SMTP transport: ${config.smtp!.host}`);
    } else if (config.provider === "sendgrid") {
        // SendGrid uses SMTP relay with API key
        transporter = nodemailer.createTransport({
            host: "smtp.sendgrid.net",
            port: 587,
            auth: {
                user: "apikey",
                pass: config.sendgrid!.apiKey,
            },
        });
        console.log("[email] Initialized SendGrid transport");
    } else if (config.provider === "mailgun") {
        // Mailgun SMTP
        transporter = nodemailer.createTransport({
            host: "smtp.mailgun.org",
            port: 587,
            auth: {
                user: `postmaster@${config.mailgun!.domain}`,
                pass: config.mailgun!.apiKey,
            },
        });
        console.log("[email] Initialized Mailgun transport");
    }
}

interface EmailTemplate {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(options: EmailTemplate): Promise<void> {
    const config = getEmailConfig();

    if (!config.enabled || !transporter) {
        console.log(`[email] Skipped (disabled): ${options.subject} -> ${options.to}`);
        return;
    }

    const mailOptions: SendMailOptions = {
        from: config.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[email] Sent: ${options.subject} -> ${options.to} (${info.messageId})`);
    } catch (error) {
        console.error(`[email] Failed to send: ${options.subject}`, error);
        throw error;
    }
}

// GitHub-like notification emails
export async function sendIssueNotification(
    to: string,
    issueUrl: string,
    issueNumber: number,
    issueTitle: string,
    actorName: string,
    action: "opened" | "closed" | "commented" | "mentioned",
    body?: string,
): Promise<void> {
    const actionText = {
        opened: "opened",
        closed: "closed",
        commented: "commented on",
        mentioned: "mentioned you in",
    }[action];

    const subject = `[Issue #${issueNumber}] ${issueTitle}`;
    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
            <h2 style="color: #24292f;">${actorName} ${actionText} issue #${issueNumber}</h2>
            <h3 style="color: #57606a;">${issueTitle}</h3>
            ${body ? `<div style="padding: 16px; background: #f6f8fa; border-left: 3px solid #0969da; margin: 16px 0;">${body}</div>` : ""}
            <p>
                <a href="${issueUrl}" style="color: #0969da; text-decoration: none;">View it on GitTic</a>
            </p>
            <hr style="border: 0; border-top: 1px solid #d0d7de; margin: 24px 0;">
            <p style="color: #57606a; font-size: 12px;">
                You are receiving this because you are subscribed to this repository.
            </p>
        </div>
    `;

    await sendEmail({ to, subject, html });
}

export async function sendPRNotification(
    to: string,
    prUrl: string,
    prNumber: number,
    prTitle: string,
    actorName: string,
    action: "opened" | "merged" | "closed" | "reviewed" | "commented" | "mentioned",
    body?: string,
): Promise<void> {
    const actionText = {
        opened: "opened",
        merged: "merged",
        closed: "closed",
        reviewed: "reviewed",
        commented: "commented on",
        mentioned: "mentioned you in",
    }[action];

    const subject = `[PR #${prNumber}] ${prTitle}`;
    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
            <h2 style="color: #24292f;">${actorName} ${actionText} pull request #${prNumber}</h2>
            <h3 style="color: #57606a;">${prTitle}</h3>
            ${body ? `<div style="padding: 16px; background: #f6f8fa; border-left: 3px solid #8250df; margin: 16px 0;">${body}</div>` : ""}
            <p>
                <a href="${prUrl}" style="color: #8250df; text-decoration: none;">View it on GitTic</a>
            </p>
            <hr style="border: 0; border-top: 1px solid #d0d7de; margin: 24px 0;">
            <p style="color: #57606a; font-size: 12px;">
                You are receiving this because you are subscribed to this repository.
            </p>
        </div>
    `;

    await sendEmail({ to, subject, html });
}

export async function sendMentionNotification(
    to: string,
    url: string,
    mentionedBy: string,
    context: string,
    body: string,
): Promise<void> {
    const subject = `${mentionedBy} mentioned you`;
    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
            <h2 style="color: #24292f;">${mentionedBy} mentioned you in ${context}</h2>
            <div style="padding: 16px; background: #fff8c5; border-left: 3px solid #bf8700; margin: 16px 0;">
                ${body}
            </div>
            <p>
                <a href="${url}" style="color: #0969da; text-decoration: none;">View it on GitTic</a>
            </p>
        </div>
    `;

    await sendEmail({ to, subject, html });
}

export async function sendWelcomeEmail(to: string, username: string): Promise<void> {
    const subject = "Welcome to GitTic!";
    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
            <h1 style="color: #24292f;">Welcome to GitTic, ${username}! 🎉</h1>
            <p style="font-size: 16px; color: #57606a;">
                Your account has been created successfully. You can now:
            </p>
            <ul style="font-size: 16px; color: #57606a;">
                <li>Create repositories</li>
                <li>Collaborate with your team</li>
                <li>Track issues and pull requests</li>
                <li>Use DevChat to communicate with other developers</li>
            </ul>
            <p style="font-size: 16px;">
                <a href="${process.env.SERVER_URL}/dashboard" style="display: inline-block; padding: 12px 24px; background: #2da44e; color: white; text-decoration: none; border-radius: 6px;">
                    Go to Dashboard
                </a>
            </p>
        </div>
    `;

    await sendEmail({ to, subject, html });
}

export async function sendPasswordResetEmail(
    to: string,
    resetToken: string,
    resetUrl: string,
): Promise<void> {
    const subject = "Reset your GitTic password";
    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
            <h2 style="color: #24292f;">Password Reset Request</h2>
            <p style="font-size: 16px; color: #57606a;">
                You requested to reset your password. Click the button below to continue:
            </p>
            <p style="font-size: 16px;">
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #0969da; color: white; text-decoration: none; border-radius: 6px;">
                    Reset Password
                </a>
            </p>
            <p style="font-size: 14px; color: #57606a;">
                If you didn't request this, you can safely ignore this email.
            </p>
            <p style="font-size: 12px; color: #8c959f;">
                This link expires in 1 hour.
            </p>
        </div>
    `;

    await sendEmail({ to, subject, html });
}

export async function sendTeamInviteEmail(
    to: string,
    orgName: string,
    inviterName: string,
    inviteUrl: string,
): Promise<void> {
    const subject = `${inviterName} invited you to join ${orgName}`;
    const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
            <h2 style="color: #24292f;">${inviterName} invited you to join ${orgName}</h2>
            <p style="font-size: 16px; color: #57606a;">
                You've been invited to collaborate on GitTic.
            </p>
            <p style="font-size: 16px;">
                <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #2da44e; color: white; text-decoration: none; border-radius: 6px;">
                    Accept Invitation
                </a>
            </p>
        </div>
    `;

    await sendEmail({ to, subject, html });
}
