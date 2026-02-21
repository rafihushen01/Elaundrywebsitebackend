 const issup = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "SuperAdmin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied: Super Admin Only"
      });
    }

    next();
  } catch (error) {
    console.error("SuperAdmin Middleware Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
module.exports = issup;