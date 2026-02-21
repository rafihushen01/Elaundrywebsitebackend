// controller/AuthController.js
const User = require("../model/User");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const gentoken = require("../utils/Token.js"); // should accept payload object
const { sendotp, sendsuperadminotp } = require("../utils/Mail");
require("dotenv").config();

// helper: secure otp (returns { plain, hash })
const genOtp = (len = 6) => {
  // crypto secure numeric OTP
  const max = 10 ** len;
  const n = crypto.randomInt(0, max);
  const plain = String(n).padStart(len, "0");
  const hash = crypto.createHmac("sha256", process.env.OTP_HASH_SECRET || "otp-secret")
                     .update(plain).digest("hex");
  return { plain, hash };
};

const isProduction = process.env.NODE_ENV === "production";
const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge,
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
});

const signup = async (req, res) => {
  try {
    const { username, email, password, mobile, role, gender } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email & password required", success:false });
    }

    if (!validator.isEmail(email)) return res.status(400).json({ message: "Invalid email", success:false });
    if (password.length < 8) return res.status(400).json({ message: "Enter a strong password", success:false });
      if(mobile.length <10) return res.status(400).json({ message: "Enter a valid mobile number", success:false });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "User already exists", success:false });

    const hashpassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      username,
      email,
      password: hashpassword,
      mobile,
      role: role || "Customer",
      gender
    });

    const token = gentoken({ id: newUser._id, role: newUser.role });
    res.cookie("token", token, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(201).json({
      success: true,
      user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    console.error("signup error:", error);
    return res.status(500).json({ message: `signup error: ${error.message}`, success:false });
  }
};

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Email & Password are required",
        success: false
      });
    }

    // ===============================
    // 🚀 SUPERADMIN FIRST PRIORITY
    // ===============================
    const superAdminEmailRaw = String(process.env.SUPER_ADMIN_EMAIL || "").trim();
    const superAdminPass = String(process.env.SUPER_ADMIN_PASS || "");
    const isSuperAdmin =
      String(email).trim().toLowerCase() === superAdminEmailRaw.toLowerCase() &&
      password === superAdminPass;

    if (isSuperAdmin) {
      // Keep superadmin entry instant: hash only on first bootstrap.
      let admin = await User.findOne({ email: superAdminEmailRaw });

      if (!admin) {
        const hashed = await bcrypt.hash(superAdminPass, 10);
        admin = await User.create({
          username: "Super Admin",
          email: superAdminEmailRaw,
          password: hashed,
          role: "SuperAdmin",
          issuperverified: false
        });
      }

      // Generate OTP
      const { plain, hash } = genOtp(6);
      admin.issupadmin = hash;
      admin.supotpexpires = Date.now() + 5 * 60 * 1000; // 5 min
      admin.issupverify = false;
      admin.supSecurityPassed = false;
      await admin.save();

      // Never block signin response on SMTP latency.
      void sendsuperadminotp(admin.email, plain).catch((err) => {
        console.error("SuperAdmin OTP Error:", err);
      });

      return res.status(200).json({
        success: true,
        superadmin: true,
        next: "verify-superadmin-otp",
        message: "SuperAdmin identified instantly. OTP dispatch started."
      });
    }

    // ===============================
    // 👤 NORMAL USER SIGNIN
    // ===============================
    const existing = await User.findOne({ email }).select("+password");
    if (!existing) {
      return res.status(400).json({
        success: false,
        message: "Email does not exist"
      });
    }

    const isMatch = await bcrypt.compare(password, existing.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password"
      });
    }

    // generate token
    const token = gentoken({
      id: existing._id,
      role: existing.role
    });

    res.cookie("token", token, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: existing._id,
        username: existing.username,
        email: existing.email,
        role: existing.role
      }
    });

  } catch (error) {
    console.error("SIGNIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error: " + error.message
    });
  }
};
;

const signout = async (req, res) => {
  try {
    res.clearCookie("token", getClearCookieOptions());
    return res.status(200).json({ message: "logout successful", success:true });
  } catch (error) {
    console.error("signout error:", error);
    return res.status(500).json({ message: `logout error ${error.message}`, success:false });
  }
};
const sendsupotp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res.status(400).json({ success:false, message:"Email required" });

    const admin = await User.findOne({ email }).select("+issupadmin");

    if (!admin)
      return res.status(404).json({ success:false, message:"SuperAdmin not found" });

    // Only SuperAdmin should get OTP
    if (admin.role !== "SuperAdmin")
      return res.status(403).json({ success:false, message:"Not authorized" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP same way as verify controller
    const otpHash = crypto
      .createHmac("sha256", process.env.OTP_HASH_SECRET)
      .update(String(otp))
      .digest("hex");

    // Save to DB
    admin.issupadmin = otpHash;
    admin.supotpexpires = Date.now() + 5 * 60 * 1000; // 5 min
    admin.issupverify = false;

    await admin.save();

    // Never block resend response on SMTP latency.
    void sendsuperadminotp(email, otp).catch((mailErr) => {
      console.error("sendsupotp mail error:", mailErr);
    });

    return res.status(200).json({
      success: true,
      message: "SuperAdmin OTP dispatch started",
    });

  } catch (err) {
    console.error("sendsupotp error:", err);
    return res.status(500).json({ success:false, message: err.message });
  }
};

// verify superadmin email OTP
const verifysupotp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ success:false, message:"Email and OTP required" });

    // force reading OTP fields
    const admin = await User.findOne({ email })
      .lean(false)
      .select("+issupadmin")
      .select("+supotpexpires");

    if (!admin)
      return res.status(404).json({ success:false, message:"SuperAdmin not found" });

    console.log("DEBUG OTP FROM DB:", admin.issupadmin);
    console.log("DEBUG OTP EXP:", admin.supotpexpires);

    if (!admin.issupadmin)
      return res.status(400).json({ success:false, message:"No OTP requested" });

    if (admin.supotpexpires < Date.now())
      return res.status(400).json({ success:false, message:"OTP expired" });

    const otpHash = crypto
      .createHmac("sha256", process.env.OTP_HASH_SECRET)
      .update(String(otp))
      .digest("hex");

    if (otpHash !== admin.issupadmin)
      return res.status(400).json({ success:false, message:"Invalid OTP" });

    admin.issupverify = true;
    admin.issupadmin = undefined;
    admin.supotpexpires = undefined;

    await admin?.save();

    return res.status(200).json({
      success: true,
      next: "verify-security-code",
      message: "OTP verified successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success:false,
      message: "verifysupotp error: " + error.message,
    });
  }
};



// verify security code (shared secret)
const verifysupersecuritycode = async (req, res) => {
  try {
    const { email, securityCode } = req.body;
    if (!email || !securityCode) return res.status(400).json({ success:false, message:"Email & security code required" });

    const admin = await User.findOne({ email });
    if (!admin) return res.status(404).json({ success:false, message:"SuperAdmin not found" });
    if (!admin.issupverify && !admin.supEmailOtpVerifiedAt) return res.status(403).json({ success:false, message:"Email OTP step not completed" });

    if (securityCode !== process.env.SUPER_ADMIN_SECRET) return res.status(401).json({ success:false, message:"Invalid security code" });

    admin.supSecurityPassed = true;
    admin.supEmailOtpVerifiedAt = Date.now();

    await admin.save();

    return res.status(200).json({ success:true, next:"mobile-verify", message:"Security code accepted. Proceed to mobile verification." });
  } catch (error) {
    console.error("verifysupersecuritycode error:", error);
    return res.status(500).json({ success:false, message:`verifysupersecuritycode error: ${error.message}` });
  }
};

// final insane code -> issue token
const verifyinsanecode = async (req, res) => {
  try {
    const { email, insaneCode } = req.body;
    if (!email || !insaneCode) return res.status(400).json({ success:false, message:"Email & insane code required" });

    const admin = await User.findOne({ email });
    if (!admin) return res.status(404).json({ success:false, message:"SuperAdmin not found" });

    if (!admin.supSecurityPassed) return res.status(403).json({ success:false, message:"Security code not passed" });

    if (insaneCode !== process.env.SUPER_ADMIN_INSNANE_CODE) return res.status(401).json({ success:false, message:"Invalid insane code" });

    // // issue final token with role
    const token = gentoken({ id: admin._id, role: "SuperAdmin" });
    res.cookie("token", token, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    admin.isSuperFullyVerified = false;
    admin.superVerifiedAt = Date.now();
    await admin.save();

    return res.status(200).json({ success:true, message:"SuperAdmin insnane code verify "});
  } catch (error) {
    console.error("verifyinsanecode error:", error);
    return res.status(500).json({ success:false, message:`verifyinsanecode error: ${error.message}` });
  }
}

// const verifyfinalcode = async (req, res) => {
//   try {
//     const {
//       email,
//       mobile,
//       name,
//       realname,
//       address,
//       officename,
//       sonname,
//       daughter,
//       wifename,
//       mobilename,
//       earning,
//       collegename
//     } = req.body;

//     if (!email)
//       return res.status(400).json({
//         success: false,
//         message: "Email required"
//       });

//     const admin = await User.findOne({ email })
//       .select("+password +issupadmin +supotpexpires");

//     if (!admin)
//       return res.status(404).json({
//         success: false,
//         message: "SuperAdmin account not found"
//       });

//     // -------------------------
//     // SUPERADMIN BASE SECURITY
//     // -------------------------
//     if (!admin.supSecurityPassed)
//       return res.status(403).json({
//         success: false,
//         message: "SuperAdmin security phase-1 not passed"
//       });

//     if (!admin.issupverify)
//       return res.status(403).json({
//         success: false,
//         message: "Email OTP verification not completed"
//       });

//     // ------------------------------------------
//     // ACCOUNT LOCK PROTECTION
//     // ------------------------------------------
//     if (admin.lockedUntil && admin.lockedUntil > Date.now()) {
//       return res.status(429).json({
//         success: false,
//         message: "Account temporarily locked due to multiple failed attempts"
//       });
//     }

//     // -------------------------------------------------------
//     // CHECK ALL FINAL DATA AGAINST SERVER ENV CONFIG
//     // -------------------------------------------------------
//     const master = {
//       mobile: process.env.SUPER_ADMIN_MOBILE,
//       realname: process.env.SUPER_ADMIN_REALNAME,
//     officename: process.env.SUPER_ADMIN_OFFICE,
//       home: process.env.SUPER_ADMIN_HOME,
//       sonname: process.env.SUPER_ADMIN_SONNAME,
//       daughter: process.env.SUPER_ADMIN_DAUGHTER,
//       wifename: process.env.SUPER_ADMIN_WIFE_NAME,
//       mobilename: process.env.SUPER_ADMIN_MOBILE_NAME,
//       earning: process.env.SUPER_ADMIN_EARNING,
//       collegename: process.env.SUPER_ADMIN_COLLEGE_NAME,
//       name:process.env.SUPER_ADMIN_NAME
//     };

//     // ---------------------------
//     // VALIDATE FINAL VERIFICATION
//     // ---------------------------
//     if (
//       mobile !== master.mobile ||
//       realname !== master.realname ||
//       officename !== master.office ||
//       address !== master.home ||
//       sonname !== master.sonname ||
//       daughter !== master.daughter ||
//       wifename !== master.wifename ||
//       mobilename !== master.mobilename ||
//       earning !== master.earning ||
//       collegename !== master.collegename ||
//       name !==master.name
//     ) {
//       admin.failedLoginAttempts++;

//       // lock account after 5 wrong attempts
//       if (admin.failedLoginAttempts >= 10) {
//         admin.lockedUntil = Date.now() + 30 * 60 * 1000; // 30 mins lock
//       }
//      // issue final token with role
//     const token = gentoken({ id: admin._id, role: "SuperAdmin" });
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: false,
//       sameSite: "Strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000,
//     });
//       await admin.save();

//       return res.status(401).json({
//         success: false,
//         message: "Final SuperAdmin verification failed"
//       });
//     }

//     // ------------------------------------------------
//     // IF EVERYTHING MATCHES → FINAL VERIFICATION PASS
//     // ------------------------------------------------
//     admin.isSuperFullyVerified = true;
//     admin.superVerifiedAt = new Date();
//     admin.failedLoginAttempts = 0;
//     admin.lockedUntil = null;

//     await admin.save();

//     return res.status(200).json({
//       success: true,
//       message: "🔥 FINAL SUPERADMIN VERIFICATION PASSED — ACCESS GRANTED",
//       fullyVerified: true,
//       finalLevel: "SUPER_ADMIN_ULTIMATE_AUTHORIZATION"
//     });

//   } catch (error) {
//     console.error("FINAL_SUPER_ADMIN_ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error"
//     });
//   }
// };

// password reset flow (sendotp, verifyotp, resetpass) - keep but make sure sendotp uses hashed store
const sendmailotp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message:"user not found", success:false });

    const { plain, hash } = genOtp(6);
    user.resetotp = hash;
    user.otpexpires = Date.now() + (5 * 60 * 1000);
    user.isverifyotp = false;
    await user.save();

    await sendotp(email, plain).catch(err => console.error(err));
    return res.status(200).json({ message:"otp sent successfully", success:true });
  } catch (error) {
    console.error("sendmailotp error:", error);
    return res.status(500).json({ message:`sendmailotp error: ${error.message}`, success:false });
  }
};

const verifyotp = async (req,res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select("+resetotp +otpexpires");
    if (!user) return res.status(404).json({ message:"user not found", success:false });
    if (!otp) return res.status(400).json({ message:"otp is required", success:false });
    if (user.otpexpires < Date.now()) return res.status(400).json({ message:"otp expired", success:false });

    const otpHash = crypto.createHmac("sha256", process.env.OTP_HASH_SECRET || "otp-secret").update(String(otp)).digest("hex");
    if (otpHash !== user.resetotp) return res.status(400).json({ message:"invalid otp", success:false });

    user.isverifyotp = true;
    user.resetotp = undefined;
    user.otpexpires = undefined;
    await user.save();

    return res.status(200).json({ message:"otp verified successfully", success:true });
  } catch (error) {
    console.error("verifyotp error:", error);
    return res.status(500).json({ message:`verifyotp error: ${error.message}`, success:false });
  }
};

const resetpassword = async (req,res) => {
  try {
    const { email, newpass } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message:"user not found", success:false });
    if (!user.isverifyotp) return res.status(403).json({ message:"otp verification required before resetting password", success:false });
    if (!newpass || newpass.length < 8) return res.status(400).json({ message:"new password too weak", success:false });

    user.password = await bcrypt.hash(newpass, 12);
    user.isverifyotp = false;
    await user.save();

    return res.status(200).json({ message:"password reset successfully", success:true });
  } catch (error) {
    console.error("resetpassword error:", error);
    return res.status(500).json({ message:`resetpassword error: ${error.message}`, success:false });
  }
};
const googleauthlogin = async(req,res) => {
  try {
    const { username, email } = req.body;
    const existinguser = await User.findOne({ email });
    if(!existinguser){
      return res.status(400).json({ message: "User does not exist, go to signup first" });
    }

    existinguser.username = username; // optional update
    const token = await gentoken({id: existinguser._id, role: existinguser.role});
    res.cookie("token", token, getCookieOptions(3 * 24 * 60 * 60 * 1000));
    return res.status(200).json({ message: "Login Successful", success:true,
           user: {
        id: existinguser._id,
        username: existinguser.username,
        email: existinguser.email,
        role: existinguser.role,
      },
      
     });
  } catch (error) {
    return res.status(500).json({ message: `googleauth error: ${error.message}`, success:false });
  }
}
const googleauth = async (req, res) => {
  try {
    const { email, username,mobile,role,gender} = req.body; // role & mobile বাদ
    let existinguser = await User.findOne({ email });

    if (!existinguser) {
      const newUser = await User.create({
        username,
        email,
        role: "Customer" ||newUser.role,
        mobile,
       
       gender// default role
      });

      const token = await gentoken({id:newUser._id,role:newUser.role});
      res.cookie("token", token, getCookieOptions(3 * 24 * 60 * 60 * 1000));

      return res.status(200).json({ success: true, user: newUser });
    } else {
      // existing user → login
      const token = await gentoken({id: existinguser._id, role: existinguser.role});
      res.cookie("token", token, getCookieOptions(7 * 24 * 60 * 60 * 1000));
      return res.status(200).json({
        success: true,
        message: "User already exists, logged in successfully",

              user: {
        id: existinguser._id,
        username: existinguser.username,
        email: existinguser.email,
        role: existinguser.role,
        mobile:existinguser.mobile
      },
      });
    }
  } catch (error) {
    return res.status(500).json({ message: `googleauth error: ${error.message}`, success:false });
  }
}

module.exports = {
  signup, signin, signout, sendmailotp, verifyotp, resetpassword,
  verifysupotp, verifysupersecuritycode, verifyinsanecode,googleauth,googleauthlogin,sendsupotp
};
