const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../model/User");
dotenv.config();
const secretkey = process.env.SECRET_KEY;

const isAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: token missing" });
    }

    const decodedtoken = jwt.verify(token, secretkey);

    req.userId = decodedtoken?.id;   // ObjectId string
    req.role = decodedtoken?.role;   // SuperAdmin
// entire payload
    next();
  } catch (error) {
    return res.status(400).json({ message: `isAuth error: ${error.message}` });
  }
};

module.exports = isAuth;
