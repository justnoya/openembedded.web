/**
 * backend/src/lib/emailTemplate.js
 *
 * Professional HTML email template for OpenEmbedded verification emails.
 */

/**
 * @param {{ verifyUrl: string, expiresMinutes: number, appUrl: string }} opts
 */
function verificationEmailHtml({ verifyUrl, expiresMinutes = 30, appUrl }) {
    const bannerUrl = `${appUrl}/email-banner.png`;
    const iconUrl   = `${appUrl}/email-icon.png`;
    const year      = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Verify your OpenEmbedded login</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0e0f12;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0e0f12;padding:32px 0 48px;">
  <tr>
    <td align="center">

      <!-- ── Outer container ──────────────────────────────────── -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
             style="max-width:560px;width:100%;">

        <!-- ── Banner image ─────────────────────────────────── -->
        <tr>
          <td style="padding:0;border-radius:12px 12px 0 0;overflow:hidden;line-height:0;font-size:0;">
            <img src="${bannerUrl}"
                 alt="OpenEmbedded"
                 width="560"
                 style="display:block;width:100%;max-width:560px;height:auto;border-radius:12px 12px 0 0;border:0;"
            />
          </td>
        </tr>

        <!-- ── Main card ─────────────────────────────────────── -->
        <tr>
          <td style="background-color:#1e2024;border-radius:0 0 12px 12px;padding:0;">

            <!-- App icon -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding:36px 40px 0;">
                  <img src="${iconUrl}"
                       alt="OpenEmbedded icon"
                       width="72"
                       height="72"
                       style="display:block;width:72px;height:72px;border-radius:16px;border:0;"
                  />
                </td>
              </tr>
            </table>

            <!-- Heading -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding:24px 48px 8px;">
                  <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;line-height:1.25;">
                    Verify your login
                  </h1>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding:0 48px 32px;">
                  <p style="margin:0;font-size:15px;color:#9b9fa8;line-height:1.65;text-align:center;">
                    Someone requested a sign-in link for your OpenEmbedded account.<br/>
                    If that was you, click the button below to complete your login.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:0 40px;">
                  <div style="height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent);"></div>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding:32px 40px 28px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="border-radius:8px;background-color:#5865f2;">
                        <a href="${verifyUrl}"
                           style="display:inline-block;padding:15px 48px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;letter-spacing:0.01em;white-space:nowrap;">
                          Verify &amp; Sign In &nbsp;→
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Expiry pill -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding:0 40px 32px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="background-color:#16181c;border:1px solid rgba(255,255,255,0.06);border-radius:100px;padding:8px 20px;">
                        <p style="margin:0;font-size:12px;font-weight:600;color:#6b7280;letter-spacing:0.03em;text-transform:uppercase;white-space:nowrap;">
                          &#x23F1;&#xFE0E;&nbsp; Expires in <span style="color:#b9bbbe;">${expiresMinutes} minutes</span> &nbsp;·&nbsp; Single use
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:0 40px;">
                  <div style="height:1px;background:rgba(255,255,255,0.06);"></div>
                </td>
              </tr>
            </table>

            <!-- Fallback link block -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding:24px 40px;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#4f545c;text-transform:uppercase;letter-spacing:0.06em;">
                    Button not working?
                  </p>
                  <p style="margin:0;font-size:12px;color:#4f545c;line-height:1.5;">
                    Copy and paste this link into your browser:
                  </p>
                  <p style="margin:6px 0 0;font-size:11px;word-break:break-all;line-height:1.5;">
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
              Your account remains secure — nobody has access until you click the link.
            </p>
            <p style="margin:12px 0 0;font-size:11px;color:#2c2e33;text-align:center;">
              © ${year} OpenEmbedded &nbsp;·&nbsp; All rights reserved
            </p>
          </td>
        </tr>

      </table>
      <!-- /outer container -->

    </td>
  </tr>
</table>

</body>
</html>`;
}

module.exports = { verificationEmailHtml };
