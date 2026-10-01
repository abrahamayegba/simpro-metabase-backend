import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(
  to: string,
  subject: string,
  htmlContent: string
) {
  try {
    await sgMail.send({
      to,
      from: { email: process.env.EMAIL_FROM!, name: "Virtual Services" },
      subject,
      html: htmlContent,
    });
    console.log("Email sent to", to);
  } catch (error: any) {
    console.error("SendGrid error:", error.response?.body || error.message);
    throw new Error("Failed to send email");
  }
}
