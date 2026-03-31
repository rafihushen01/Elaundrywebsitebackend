const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

/*
==============================================
ENVIRONMENT VARIABLES
==============================================
*/

const gmailUser = String(process.env.GMAIL || "").trim();
const rawPass = String(process.env.APP_PASS || process.env.App_Pass || "").trim();
const gmailPass = rawPass.replace(/\s+/g, "");

/*
==============================================
VALIDATE CONFIG
==============================================
*/

const assertMailConfig = () => {
  if (!gmailUser || !gmailPass) {
    throw new Error(
      "Missing mail credentials. Please set GMAIL and APP_PASS in environment variables."
    );
  }
};

/*
==============================================
SMTP TRANSPORTER (PRODUCTION READY)
==============================================
*/

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  family: 4, // force IPv4 (prevents ENETUNREACH IPv6 error)
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
});

/*
==============================================
VERIFY MAIL SERVER
==============================================
*/

transporter
  .verify()
  .then(() => {
    console.log("✅ E-Laundry Mail Server Ready");
  })
  .catch((err) => {
    console.error("❌ Mail Server Error:", err);
  });

/*
==============================================
CORE MAIL ENGINE
==============================================
*/

const sendMailInternal = async (to, subject, html) => {
  assertMailConfig();

  try {
    return await transporter.sendMail({
      from: `E-Laundry Security <${gmailUser}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("❌ SMTP Send Error:", error.message);
    throw new Error(`SMTP send failed: ${error.message}`);
  }
};

/*
==============================================
OTP MAIL TEMPLATE
==============================================
*/

const sendotp = async (email, otp) => {
  const html = `
  <div style="font-family:Segoe UI,Arial;max-width:520px;margin:auto;padding:24px;border-radius:14px;background:#0f172a;color:#f8fafc;border:1px solid #1e293b">

    <h2 style="text-align:center;color:#22c55e">
      E-Laundry Security
    </h2>

    <p>Hello 👋</p>

    <p>Your password reset OTP is:</p>

    <div style="text-align:center;margin:25px 0">
      <span style="font-size:34px;font-weight:700;letter-spacing:8px;color:#22c55e">
        ${otp}
      </span>
    </div>

    <p>⏳ This OTP will expire in <b>5 minutes</b></p>

    <p style="font-size:13px;color:#94a3b8">
      ⚠️ Never share this code with anyone.
    </p>

  </div>
  `;

  return sendMailInternal(
    email,
    "Reset Your Password - E-Laundry",
    html
  );
};

/*
==============================================
SUPER ADMIN OTP
==============================================
*/

const sendsuperadminotp = async (email, otp) => {
  const html = `
  <div style="font-family:Segoe UI,Arial;max-width:520px;margin:auto;padding:24px;border-radius:14px;background:#0f172a;color:#f8fafc;border:1px solid #1e293b">

    <h2 style="text-align:center;color:#22c55e">
      E-Laundry Super Admin Verification
    </h2>

    <p>Your verification OTP:</p>

    <div style="text-align:center;margin:25px 0">
      <span style="font-size:34px;font-weight:700;letter-spacing:8px;color:#22c55e">
        ${otp}
      </span>
    </div>

    <p>⏳ OTP expires in <b>5 minutes</b></p>

  </div>
  `;

  return sendMailInternal(
    email,
    "Super Admin Verification - E-Laundry",
    html
  );
};

module.exports = {
  sendotp,
  sendsuperadminotp,
};
