const baseStyles = `font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FAFAF9; padding: 40px 20px; color: #171717; margin: 0;`;
const cardStyles = `max-width: 500px; margin: 0 auto; background-color: #ffffff; border: 1px solid rgba(23, 23, 23, 0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(23, 23, 23, 0.04);`;
const topAccentStyles = `height: 6px; background-color: #F4B400; line-height: 6px; font-size: 6px;`;
const headerStyles = `background-color: #171717; padding: 32px; text-align: center; border-bottom: 1px solid rgba(23, 23, 23, 0.08);`;
const logoStyles = `margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;`;
const contentStyles = `padding: 40px 32px; text-align: left;`;
const headingStyles = `margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #171717; line-height: 1.3;`;
const textStyles = `font-size: 14px; line-height: 1.6; margin-bottom: 24px; color: #525252;`;
const otpBoxStyles = `display: block; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #171717; background-color: #F4F4F2; padding: 16px 24px; border-radius: 8px; border: 1px solid rgba(23, 23, 23, 0.06); margin: 24px auto; text-align: center; width: max-content;`;
const otpSubtextStyles = `font-size: 11px; color: #A3A3A3; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; text-align: center; margin-top: -16px; margin-bottom: 24px;`;
const noteStyles = `font-size: 13px; color: #A3A3A3; margin-top: 24px; line-height: 1.5;`;
const footerStyles = `padding: 24px 32px; text-align: center; font-size: 12px; color: #737373; border-top: 1px solid rgba(23, 23, 23, 0.06); background-color: #FAFAF9;`;
const footerCopyStyles = `margin: 8px 0 0 0; font-size: 11px; color: #A3A3A3;`;

const emailStyles = `
  body { ${baseStyles} }
  .container { ${cardStyles} }
  .top-accent { ${topAccentStyles} }
  .header { ${headerStyles} }
  .logo { ${logoStyles} }
  .content { ${contentStyles} }
  .heading { ${headingStyles} }
  .text { ${textStyles} }
  .otp-box { ${otpBoxStyles} }
  .otp-subtext { ${otpSubtextStyles} }
  .note { ${noteStyles} }
  .footer { ${footerStyles} }
  .footer-copy { ${footerCopyStyles} }
`;

export const otpEmailTemplate = (otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email Address</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body style="${baseStyles}">
      <div class="container" style="${cardStyles}">
        <div class="top-accent" style="${topAccentStyles}"></div>
        <div class="header" style="${headerStyles}">
          <h1 class="logo" style="${logoStyles}">
            <span style="color: #F4B400;">Pustak</span><span style="color: #ffffff;">Mart</span>
          </h1>
        </div>
        <div class="content" style="${contentStyles}">
          <div class="heading" style="${headingStyles}">Verify your email address</div>
          <p class="text" style="${textStyles}">Thank you for choosing PustakMart. Please use the verification code below to complete your registration. This code is valid for 5 minutes.</p>
          <div class="otp-box" style="${otpBoxStyles}">${otp}</div>
          <div class="otp-subtext" style="${otpSubtextStyles}">One-Time Verification Code</div>
          <p class="note" style="${noteStyles}">If you did not request this verification, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer" style="${footerStyles}">
          <p style="margin: 0; color: #737373;">Connecting students, sharing knowledge.</p>
          <p class="footer-copy" style="${footerCopyStyles}">&copy; ${new Date().getFullYear()} PustakMart. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const forgotPasswordOtpEmailTemplate = (otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body style="${baseStyles}">
      <div class="container" style="${cardStyles}">
        <div class="top-accent" style="${topAccentStyles}"></div>
        <div class="header" style="${headerStyles}">
          <h1 class="logo" style="${logoStyles}">
            <span style="color: #F4B400;">Pustak</span><span style="color: #ffffff;">Mart</span>
          </h1>
        </div>
        <div class="content" style="${contentStyles}">
          <div class="heading" style="${headingStyles}">Reset your password</div>
          <p class="text" style="${textStyles}">We received a request to reset the password for your PustakMart account. Use the one-time password (OTP) code below to complete the reset process:</p>
          <div class="otp-box" style="${otpBoxStyles}">${otp}</div>
          <div class="otp-subtext" style="${otpSubtextStyles}">One-Time Verification Code</div>
          <p class="note" style="${noteStyles}">If you did not initiate this request, your account is still secure and you can safely ignore this email.</p>
        </div>
        <div class="footer" style="${footerStyles}">
          <p style="margin: 0; color: #737373;">Connecting students, sharing knowledge.</p>
          <p class="footer-copy" style="${footerCopyStyles}">&copy; ${new Date().getFullYear()} PustakMart. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const recoverAccountOtpEmailTemplate = (otp) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recover Your Account</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body style="${baseStyles}">
      <div class="container" style="${cardStyles}">
        <div class="top-accent" style="${topAccentStyles}"></div>
        <div class="header" style="${headerStyles}">
          <h1 class="logo" style="${logoStyles}">
            <span style="color: #F4B400;">Pustak</span><span style="color: #ffffff;">Mart</span>
          </h1>
        </div>
        <div class="content" style="${contentStyles}">
          <div class="heading" style="${headingStyles}">Recover your account</div>
          <p class="text" style="${textStyles}">We received a request to recover your deleted PustakMart account. Use the following one-time password (OTP) code to reactivate your account:</p>
          <div class="otp-box" style="${otpBoxStyles}">${otp}</div>
          <div class="otp-subtext" style="${otpSubtextStyles}">One-Time Verification Code</div>
          <p class="note" style="${noteStyles}">If you did not initiate this recovery process, please contact support immediately.</p>
        </div>
        <div class="footer" style="${footerStyles}">
          <p style="margin: 0; color: #737373;">Connecting students, sharing knowledge.</p>
          <p class="footer-copy" style="${footerCopyStyles}">&copy; ${new Date().getFullYear()} PustakMart. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const accountRecoveredEmailTemplate = () => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Successfully Recovered</title>
      <style>
        ${emailStyles}
      </style>
    </head>
    <body style="${baseStyles}">
      <div class="container" style="${cardStyles}">
        <div class="top-accent" style="${topAccentStyles}"></div>
        <div class="header" style="${headerStyles}">
          <h1 class="logo" style="${logoStyles}">
            <span style="color: #F4B400;">Pustak</span><span style="color: #ffffff;">Mart</span>
          </h1>
        </div>
        <div class="content" style="${contentStyles}">
          <div class="heading" style="${headingStyles}">Account successfully recovered</div>
          <p class="text" style="${textStyles}">We are pleased to inform you that your PustakMart account associated with this email address has been successfully recovered and reactivated.</p>
          <p class="text" style="${textStyles}">You can now log in using your password.</p>
          <p class="note" style="${noteStyles}">If you did not initiate this action, please contact support immediately.</p>
        </div>
        <div class="footer" style="${footerStyles}">
          <p style="margin: 0; color: #737373;">Connecting students, sharing knowledge.</p>
          <p class="footer-copy" style="${footerCopyStyles}">&copy; ${new Date().getFullYear()} PustakMart. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
