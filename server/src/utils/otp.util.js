//function to generate otp
export function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


//function for email html format to send otp
export function getOtpHtml(otp) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAFAF9; color: #171717; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background-color: #FAFAF9; width: 100%; height: 100%; padding: 40px 20px;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse: collapse; width: 100%; max-width: 500px; background-color: #FFFFFF; border: 1px solid rgba(23, 23, 23, 0.08); border-radius: 12px; box-shadow: 0 4px 16px rgba(23, 23, 23, 0.04); overflow: hidden; text-align: left;">
                    <!-- Top Accent Bar -->
                    <tr>
                        <td height="6" style="background-color: #F4B400; line-height: 6px; font-size: 6px;">&nbsp;</td>
                    </tr>
                    
                    <!-- Content Area -->
                    <tr>
                        <td style="padding: 40px 32px;">
                            <!-- Logo / Branding -->
                            <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse: collapse; width: 100%; margin-bottom: 32px;">
                                <tr>
                                    <td>
                                        <span style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #171717;">
                                            PustakMart
                                        </span>
                                    </td>
                                </tr>
                            </table>

                            <!-- Heading -->
                            <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #171717; line-height: 1.3;">
                                Verify your email address
                            </h1>
                            
                            <!-- Body Text -->
                            <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #525252;">
                                Thank you for choosing PustakMart. Please use the verification code below to complete your authentication request. This code is valid for 5 minutes.
                            </p>
                            
                            <!-- OTP Box -->
                            <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse: collapse; width: 100%; margin-bottom: 24px; background-color: #FAFAF9; border: 1px solid rgba(23, 23, 23, 0.06); border-radius: 8px;">
                                <tr>
                                    <td align="center" style="padding: 20px 24px;">
                                        <div style="font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #171717; margin-bottom: 4px;">
                                            ${otp}
                                        </div>
                                        <div style="font-size: 11px; color: #A3A3A3; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                            One-Time Verification Code
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Warning/Security Notice -->
                            <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #A3A3A3;">
                                If you did not request this verification, please ignore this email or contact support if you have concerns.
                              </p>
                        </td>
                    </tr>
                    
                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 32px;">
                            <div style="border-top: 1px solid rgba(23, 23, 23, 0.06); height: 1px; line-height: 1px;">&nbsp;</div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #FAFAF9; text-align: center;">
                            <p style="margin: 0 0 8px 0; font-size: 12px; color: #737373;">
                                Connecting students, sharing knowledge.
                            </p>
                            <p style="margin: 0; font-size: 11px; color: #A3A3A3;">
                                &copy; 2026 PustakMart. All rights reserved.
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