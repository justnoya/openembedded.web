/**
 * backend/src/lib/emailTemplate.js
 *
 * Verification email — no external images so nothing can break or trigger spam.
 */

/**
 * @param {{ verifyUrl: string, expiresMinutes: number }} opts
 */
function verificationEmailHtml({ verifyUrl, expiresMinutes = 30 }) {
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Verify your OpenEmbedded login</title>
</head>
<body style="margin:0;padding:0;background-color:#0e0f12;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background-color:#0e0f12;padding:40px 0 56px;">
  <tr>
    <td align="center">

      <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0"
             style="max-width:520px;width:100%;">

        <!-- ── Logo wordmark ─────────────────────────────────── -->
        <tr>
          <td align="center" style="padding:0 0 28px;">
            <div style="display:inline-block;background:#5865f2;border-radius:10px;padding:10px 20px;">
              <span style="font-size:17px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                Open<span style="opacity:0.75;">Embedded</span>
              </span>
            </div>
          </td>
        </tr>

        <!-- ── Main card ──────────────────────────────────────── -->
        <tr>
          <td style="background-color:#1e2024;border-radius:14px;padding:48px 48px 40px;border:1px solid rgba(255,255,255,0.06);">

            <!-- Heading -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding:0 0 12px;">
                  <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;line-height:1.25;">
                    Verify your login
                  </h1>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:0 0 36px;">
                  <p style="margin:0;font-size:15px;color:#9b9fa8;line-height:1.65;text-align:center;">
                    Someone requested a sign-in link for your<br/>OpenEmbedded account.
                    If that was you, click below.
                  </p>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding:0 0 28px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="border-radius:8px;background-color:#5865f2;">
                        <a href="${verifyUrl}"
                           style="display:inline-block;padding:15px 52px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.01em;white-space:nowrap;">
                          Verify &amp; Sign In &nbsp;&rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Expiry notice -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding:0 0 36px;">
                  <p style="margin:0;font-size:12px;color:#6b7280;letter-spacing:0.02em;">
                    &#x23F1; Expires in <strong style="color:#9b9fa8;">${expiresMinutes} minutes</strong> &nbsp;&middot;&nbsp; Single use
                  </p>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:0 0 28px;">
                  <div style="height:1px;background:rgba(255,255,255,0.07);"></div>
                </td>
              </tr>
            </table>

            <!-- Fallback link -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#4f545c;text-transform:uppercase;letter-spacing:0.06em;">
                    Button not working?
                  </p>
                  <p style="margin:0 0 6px;font-size:12px;color:#4f545c;line-height:1.5;">
                    Copy and paste this link into your browser:
                  </p>
                  <p style="margin:0;font-size:11px;word-break:break-all;line-height:1.6;">
                    <a href="${verifyUrl}" style="color:#5865f2;text-decoration:none;">${verifyUrl}</a>
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- ── Footer ──────────────────────────────────────────── -->
        <tr>
          <td align="center" style="padding:24px 40px 0;">
            <p style="margin:0 0 6px;font-size:12px;color:#3d4047;line-height:1.6;text-align:center;">
              If you didn't request this, you can safely ignore this email.<br/>
              Your account remains secure until you click the link.
            </p>
            <p style="margin:10px 0 0;font-size:11px;color:#2c2e33;text-align:center;">
              &copy; ${year} OpenEmbedded &nbsp;&middot;&nbsp; All rights reserved
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
}

module.exports = { verificationEmailHtml };
