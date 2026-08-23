import { otpEmailTemplate, forgotPasswordOtpEmailTemplate } from "../templates/email.template.js";

//function to generate otp
export function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


//function for email html format to send otp
export function getOtpHtml(otp, type = "register") {
    if (type === "forgot") {
        return forgotPasswordOtpEmailTemplate(otp);
    }
    return otpEmailTemplate(otp);
}