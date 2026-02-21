const user = require("../model/User.js");

const getcurrentuser = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({ message: "USER ID IS NOT FOUND" });
    }

    // ✅ correct usage
    const User = await user.findById(userId).select("-password");

    if (!User) {
      return res.status(404).json({ message: "User does not exist" });
    }

return res.status(200).json(User);
  } catch (error) {
    return res.status(500).json({ message: `getcurrent error: ${error.message}` });
  }
};
module.exports={getcurrentuser}