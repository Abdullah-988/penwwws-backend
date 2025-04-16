export const emailTemplate = `<div>
    <table cellpadding="0" cellspacing="0" width="100%" bgcolor="#f3f2f0" style="padding: 20px 0;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" width="600" bgcolor="#ffffff" style="border-radius:4px; overflow:hidden;">
            <!-- Logo -->
            <tr>
              <td align="left" style="padding: 40px; background-color: #28362C;">
                <img src="{{logoUrl}}" alt="Logo" width="150" style="display: block;" />
              </td>
            </tr>

            <!-- Message -->
            <tr>
              <td style="padding: 20px 40px 10px 40px; font-family: Arial, sans-serif; font-size: 16px; color: #555555;">
                <h1 style="margin: 0 0 15px; font-size: 20px;">Hey {{userName}},</h1>
                <p style="margin: 0 0 20px; line-height: 1.5em;">
                  Thanks for signing up! Please confirm your email address by clicking the button below.
                </p>
              </td>
            </tr>

            <!-- Button -->
            <tr>
              <td align="center" style="padding: 20px 40px 10px 40px;">
                <table cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="#0a4a38" style="border-radius: 4px;">
                      <a href="{{verifyUrl}}" target="_blank" style="
                          display: inline-block;
                          padding: 12px 24px;
                          font-family: Arial, sans-serif;
                          font-size: 16px;
                          color: #ffffff;
                          text-decoration: none;
                          font-weight: bold;
                          border-radius: 4px;">
                        Verify Email
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Link fallback -->
            <tr>
              <td style="padding: 10px 40px 0 40px; font-family: Arial, sans-serif; font-size: 14px; color: #777777;">
                <p style="margin: 0;">If you don’t see the button, click the link below:</p>
                <a href="{{verifyUrl}}" target="_blank" style="color: #0a4a38; word-break: break-all;">{{verifyUrl}}</a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 30px 40px 40px 40px; font-family: Arial, sans-serif; font-size: 12px; color: #999999;">
                If you didn’t request this, you can safely ignore this email.<br />
                &copy; {{year}} Penwwws. All rights reserved.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>`;
