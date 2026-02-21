// model/User.js
const mongoose = require("mongoose");

const userschema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String,  select: false },
  photourl: { type: String, default: "" },
  passport: { type: String },
  birthcertificate: { type: String },
  mobile: { type: String },
  role: {
    type: String,
    enum: ["SuperAdmin","Admin","Manager","FieldDirector","Customer","DeliveryBoy"],
    default: "Customer"
  },
  resetotp: { type: String, select: false }, // store hashed OTP
  isverifyotp: { type: Boolean, default: false },
  otpexpires: { type: Date },
  gender: { type: String, enum:["Male","Female","Others"] },
  verified: { type: Boolean, default: false },
  location: {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], default: [0,0] }
  },
  verifiedbysuperadmin: { type: Boolean, default: false },
issupadmin: { type: String, select: false },
supotpexpires: { type: Number, select: false },

    location:{

        type:{type:String,enum:["Point"],default:"Point"},
        coordinates:{type:[Number],default:[0,0]},

    },

 // hashed OTP for superadmin flow
  issupverify: { type: Boolean, default: false },

  supSecurityPassed: { type: Boolean, default: false },
  supEmailOtpVerifiedAt: { type: Date },
  isSuperFullyVerified: { type: Boolean, default: false },
  superVerifiedAt: { type: Date },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date }
}, { timestamps: true });
userschema.index({location:"2dsphere"})
module.exports = mongoose.model("User", userschema);
