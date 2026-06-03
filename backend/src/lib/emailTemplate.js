/**
 * backend/src/lib/emailTemplate.js
 *
 * Professional HTML email template for OpenEmbedded verification emails.
 * Mirrors the dark card aesthetic of the sign-in page.
 */

/**
 * @param {{ verifyUrl: string, expiresMinutes: number, appUrl: string }} opts
 */
function verificationEmailHtml({ verifyUrl, expiresMinutes = 30, appUrl }) {
    const logoUrl = `${appUrl}/logo.png`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your OpenEmbedded login</title>
</head>
<body style="margin:0;padding:0;background:#1e1f22;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#1e1f22;padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Logo header -->
        <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 8px 0;">
              <img
                src="${logoUrl}"
                alt="OpenEmbedded"
                width="240"
                style="display:block;width:240px;height:auto;"
              />
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table width="480" cellpadding="0" cellspacing="0" border="0"
               style="max-width:480px;width:100%;background:#2f3136;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,0.5);">
          <tr>
            <td style="padding:40px 40px 16px 40px;">

              <!-- Email icon -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <div style="display:inline-block;background:rgba(88,101,242,0.15);border-radius:50%;width:64px;height:64px;line-height:64px;text-align:center;">
                      <span style="font-size:30px;">✉️</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#ffffff;text-align:center;letter-spacing:-0.01em;">
                Verify your login
              </h1>
              <p style="margin:0 0 28px 0;font-size:15px;color:#b9bbbe;text-align:center;line-height:1.5;">
                Someone (hopefully you) just tried to sign in to OpenEmbedded.<br/>
                Click the button below to confirm it was you and complete your login.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom:28px;">
                    <a href="${verifyUrl}"
                       style="display:inline-block;background:#5865f2;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 40px;border-radius:4px;letter-spacing:0.01em;">
                      Verify &amp; Sign In
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#202225;border-radius:4px;margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 16px;">
                    <p style="margin:0;font-size:13px;color:#72767d;text-align:center;">
                      ⏱️ &nbsp;This link expires in <strong style="color:#b9bbbe;">${expiresMinutes} minutes</strong>
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Link fallback -->
              <p style="margin:0 0 8px 0;font-size:12px;color:#72767d;text-align:center;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 32px 0;font-size:11px;color:#5865f2;text-align:center;word-break:break-all;">
                <a href="${verifyUrl}" style="color:#5865f2;text-decoration:none;">${verifyUrl}</a>
              </p>

            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 32px 40px;">
              <p style="margin:0;font-size:12px;color:#4f545c;text-align:center;line-height:1.6;">
                If you didn't try to sign in, you can safely ignore this email.<br/>
                Nobody has access to your account unless they click this link.
              </p>
            </td>
          </tr>
        </table>

        <!-- Bottom brand -->
        <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;">
          <tr>
            <td align="center" style="padding:20px 0 0 0;">
              <p style="margin:0;font-size:12px;color:#4f545c;">
                © ${new Date().getFullYear()} OpenEmbedded
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
