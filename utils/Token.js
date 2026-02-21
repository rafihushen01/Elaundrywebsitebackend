const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const secretkey = process.env.SECRET_KEY;

const gentoken = (payload = {}) => {
  try {


    let id;
    let role;

    if (typeof payload === "string") {
      id = payload;
    } else if (payload && typeof payload === "object") {
      id = payload.id || payload._id;
      role = payload.role;
    }



    if (!id) {
      console.log("ERROR: ID missing in payload");
      return null;
    }

    const token = jwt.sign({ id, role: role || "Customer" }, secretkey, {
      expiresIn: "7d",
    });

    console.log("TOKEN GENERATED:", token ? "YES" : "NO");
    console.log("===== GENTOKEN DEBUG END =====");

    return token;
  } catch (err) {
    console.error("gentoken error:", err.message);
    return null;
  }
};

module.exports = gentoken;
