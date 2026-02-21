const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const gmailUser = String(process.env.GMAIL || "").trim();
const rawPass = String(process.env.APP_PASS || process.env.App_Pass || "").trim();
// Gmail app passwords are often copied with spaces every 4 chars.
const gmailPass = rawPass.replace(/\s+/g, "");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

const assertMailConfig = () => {
  if (!gmailUser || !gmailPass) {
    throw new Error(
      "Missing mail credentials. Set GMAIL and APP_PASS (or App_Pass) in environment."
    );
  }
};

const sendMailStrict = async ({ to, subject, html }) => {
  assertMailConfig();
  try {
    return await transporter.sendMail({
      from: gmailUser,
      to,
      subject,
      html,
    });
  } catch (error) {
    throw new Error(`SMTP send failed: ${error.message}`);
  }
};

const sendotp = async (to, otp) => {
  return sendMailStrict({
    to,
    subject: "Reset Your Password with E-loundrey Shop",
    html: `<p>Your otp for password reset is <b>${otp}</b>. Its expires in 5 minute.</p>`,
  });
};

const sendsuperadminotp = async (to, otp) => {
  return sendMailStrict({
    to,
    subject: "Verification otp for E-loundrey Shop",
    html: `<p>Your otp for verification is <b>${otp}</b>. Its expires in 5 minute.</p>`,
  });
};

module.exports = { sendotp, sendsuperadminotp };
