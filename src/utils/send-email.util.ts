import Mailgun from "mailgun.js";
import formData from "form-data";

export const sendEmail = async (to: string, subject: string, text: string, html: string) => {
  try {
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({ username: "api", key: process.env.MAILGUN_API_KEY || "" });

    const messageObject = {
      from: "QR Exchange Support <bdc@support.rons-automotive.com>",
      to: typeof to === "string" ? Array.of(to) : to,
      subject,
      text,
      html,
    };

    const message = await mg.messages.create("support.rons-automotive.com", messageObject);
  } catch (err) {
    console.log(err);
  }
};
