// routes/auth.js
const express = require("express");
const router = express.Router();
const {
  signup, signin, signout, sendmailotp, verifyotp, resetpassword,
  verifysupotp, verifysupersecuritycode, verifyinsanecode,sendsupotp,googleauth,googleauthlogin
} = require("../controller/AuthControlller.js");
const { getcurrentuser } = require("../controller/UserController");
const isAuth = require("../middlewares/IsAuth");
// const rateLimit = require("express-rate-limit");

// // rate limiting for auth endpoints
// const authLimiter = rateLimit({
//   windowMs: 15*60*1000,
//   max: 100,
//   message: { message: "Too many requests, try again later", success:false }
// });

router.post("/signup",  signup);
router.post("/signin", isAuth, signin); // NO isAuth here
router.post("/signout", isAuth, signout);
router.post("/sendotp", isAuth, sendmailotp);
router.post("/verifyotp", isAuth, verifyotp);
router.post("/resetpass", isAuth, resetpassword);
router.post("/verify-super-otp", isAuth, verifysupotp);
router.post("/verify-super-security", isAuth, verifysupersecuritycode);
router.post("/super-final", isAuth, verifyinsanecode);
router.get("/getcurrent", isAuth, getcurrentuser);
router.post("/sendsupotp", sendsupotp);
router.post("/googlesignup",googleauth)
router.post("/googlelogin",isAuth,googleauthlogin)
// router.post("/suppfulll",verifyfinalcode)
module.exports = router;
