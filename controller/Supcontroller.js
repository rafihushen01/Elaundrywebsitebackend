const bcrypt = require("bcryptjs");
const gentoken = require("../utils/Token.js");
const user = require("../model/User.js");

const superadmincreateuser = async (req, res) => {
  try {
    const { username, email, password, role, gender, mobile } = req.body;

    // ====== BASIC VALIDATION ======
    if (!username || !email || !password || !role || !gender || !mobile) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // ====== ROLE VALIDATION ======
    const allowedRoles = [
      "Admin",
      "Manager",
      "FieldDirector",
      "Customer",
      "DeliveryBoy",
      "SuperAdmin"
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role provided."
      });
    }

    // ====== CHECK EXISTING USER ======
    const existing = await user.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    // ====== HASH PASSWORD ======
    const hashed = await bcrypt.hash(password, 12);

    // ====== CREATE USER ======
    const newuser = await user.create({
      username,
      email,
      password: hashed,
      role,
      gender,
      mobile,
      verifiedbysuperadmin: true // auto verified for superadmin action
    });

    // ====== JWT TOKEN ======
    const token = gentoken({
      id: newuser._id,
      role: newuser.role
    });

    // ====== COOKIE ======
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, 
      sameSite: "Lax",
     
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
       await newuser.save()
    // ====== SUCCESS ======
    return res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      user: {
        id: newuser._id,
        username: newuser.username,
        email: newuser.email,
        role: newuser.role,
        gender: newuser.gender,
        mobile: newuser.mobile
      }
    });

  } catch (error) {
    console.error("SuperAdmin Create User Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};
module.exports={superadmincreateuser}