"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const mail_1 = __importDefault(require("@sendgrid/mail"));
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
async function sendEmail(to, subject, htmlContent) {
    try {
        await mail_1.default.send({
            to,
            from: { email: process.env.EMAIL_FROM, name: "Virtual Services" },
            subject,
            html: htmlContent,
        });
        console.log("Email sent to", to);
    }
    catch (error) {
        console.error("SendGrid error:", error.response?.body || error.message);
        throw new Error("Failed to send email");
    }
}
