import sgMail, { MailDataRequired } from "@sendgrid/mail";

export const sendEmail = async (to: string | string[], subject: string, text: string, html: string) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
  try {
    const messageObject: MailDataRequired = {
      from: "info@qrexchange.com",
      to: "syedabdullahsaad1@gmail.com",
      subject,
      text,
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>Password Reset OTP</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin: 0; padding: 0;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
            <td style="padding: 20px 0 30px 0;">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; border: 1px solid #cccccc;">
                    <tr>
                        <td align="center" bgcolor="#70bbd9" style="padding: 40px 0 30px 0;">
                            <img src="https://via.placeholder.com/300x150.png?text=Your+Logo" alt="Your Logo" width="300" height="150" style="display: block;" />
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #153643; font-family: Arial, sans-serif; font-size: 24px;">
                                        <b>Password Reset Request</b>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 20px 0 30px 0; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px;">
                                        We received a request to reset your password. Use the following OTP to complete the process:
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" bgcolor="#70bbd9" style="padding: 12px 18px 12px 18px; border-radius: 8px">
                                                    <span style="font-size: 28px; font-family: Arial, sans-serif; font-weight: bold; color: #ffffff;">123456</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 30px 0 0 0; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px;">
                                        This OTP will expire in 10 minutes. If you did not request a password reset, please ignore this email or contact support if you have concerns.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#ee4c50" style="padding: 30px 30px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td style="color: #ffffff; font-family: Arial, sans-serif; font-size: 14px;">
                                        &copy; 2024 Your Company Name<br/>
                                        <a href="http://www.example.com" style="color: #ffffff;">Unsubscribe</a> to this newsletter instantly
                                    </td>
                                    <td align="right">
                                        <table border="0" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td>
                                                    <a href="http://www.twitter.com/">
                                                        <img src="https://via.placeholder.com/38x38.png?text=T" alt="Twitter" width="38" height="38" style="display: block;" border="0" />
                                                    </a>
                                                </td>
                                                <td style="font-size: 0; line-height: 0;" width="20">&nbsp;</td>
                                                <td>
                                                    <a href="http://www.facebook.com/">
                                                        <img src="https://via.placeholder.com/38x38.png?text=F" alt="Facebook" width="38" height="38" style="display: block;" border="0" />
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
    };

    const message = await sgMail.send(messageObject);
    console.log("message", message);
  } catch (err) {
    console.log(err);
  }
};
