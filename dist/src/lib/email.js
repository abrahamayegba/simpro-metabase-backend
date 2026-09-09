"use strict";
// import nodemailer from "nodemailer";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT) || 2525,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });
// export async function sendEmail(to: string, subject: string, text: string) {
//   try {
//     await transporter.sendMail({
//       from: '"Your App" <no-reply@yourapp.com>',
//       to,
//       subject,
//       text,
//     });
//     console.log(`[MAIL SENT] to=${to} subject=${subject}`);
//   } catch (err) {
//     console.error("sendEmail error:", err);
//   }
// }
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
