import axios from "axios";
import { env } from "../../config/env";

export async function sendVerificationEmail(to: string, firstName: string, token: string) {
  if (!env.BREVO_API_KEY) {
    console.log(`[dev] verify token for ${to}: ${token}`);
    return;
  }

  const verifyUrl = `${env.FRONTEND_URL}/auth/verify-email?token=${token}`;

  await axios.post(
    "https://api.brevo.com/v3/smtp/email",
    {
      sender: { name: "AskBase", email: env.EMAIL_FROM },
      to: [{ email: to, name: firstName }],
      subject: "Verify your AskBase account",
      htmlContent: buildHtml(firstName, verifyUrl),
    },
    {
      headers: {
        "api-key": env.BREVO_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );
}

function buildHtml(firstName: string, verifyUrl: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Inter,ui-sans-serif,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:48px 24px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#161616;border-radius:16px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

        <tr>
          <td style="padding:32px 40px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <table cellpadding="0" cellspacing="0"><tr>
              <td>
                <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="8" fill="#6366f1"/>
                  <path d="M16 8L22.5 24M16 8L9.5 24M12 19.5H20" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </td>
              <td style="padding-left:10px;">
                <span style="color:rgba(255,255,255,0.8);font-size:15px;font-weight:600;letter-spacing:-0.02em;">AskBase</span>
              </td>
            </tr></table>
          </td>
        </tr>

        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 8px;color:rgba(255,255,255,0.9);font-size:22px;font-weight:600;letter-spacing:-0.025em;">Verify your email</p>
            <p style="margin:0 0 28px;color:rgba(255,255,255,0.4);font-size:14px;line-height:1.6;">
              Hi ${firstName}, thanks for signing up. Click the button below to verify your email address and activate your account.
            </p>
            <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:10px;letter-spacing:-0.01em;">
              Verify email address
            </a>
            <p style="margin:28px 0 0;color:rgba(255,255,255,0.2);font-size:12px;line-height:1.6;">
              This link expires in 24 hours. If you didn't create an AskBase account, you can safely ignore this email.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;color:rgba(255,255,255,0.15);font-size:11px;">
              © 2026 AskBase &middot; <a href="http://localhost:3000" style="color:rgba(255,255,255,0.25);text-decoration:none;">askbase.io</a>
            </p>
          </td>
        </tr>

      </table>
      <p style="color:rgba(255,255,255,0.15);font-size:11px;margin-top:20px;text-align:center;">
        Button not working? <a href="${verifyUrl}" style="color:rgba(129,140,248,0.6);">Copy this link</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}
