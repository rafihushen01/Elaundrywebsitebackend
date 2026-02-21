// controller/Shopcontroller.js
const Shop = require("../model/Shop.js")
const uploadoncloudinary = require("../utils/Cloudinary.jsx")

// addshop & editshop (your existing logic)...
const addshop = async (req, res) => {
  try {
    const { name, mobile, email, city, state, address, branch } = req.body

    let image = null
    if (req.file) {
      const uploaded = await uploadoncloudinary(req.file.path)
      image = uploaded
    }

    const newshop = new Shop({
      name,
      mobile,
      email,
      city,
      state,
      address,
      branch,
      image,
    })

    await newshop.save()
    return res.status(200).json({ success: true, message: "Shop added", data: newshop })
  } catch (err) {
    console.error("addshop error", err)
    return res.status(500).json({ success: false, message: "Internal server error" })
  }
}

const editshop = async (req, res) => {
  try {
    const { id } = req.params
    const { name, mobile, email, city, state, address, branch } = req.body

    const exist = await Shop.findById(id)
    if (!exist) return res.status(404).json({ success: false, message: "Shop not found" })

    if (req.file) {
      const uploaded = await uploadoncloudinary(req.file.path)
      exist.image = uploaded
    }

    exist.name = name || exist.name
    exist.mobile = mobile || exist.mobile
    exist.email = email || exist.email
    exist.city = city || exist.city
    exist.state = state || exist.state
    exist.address = address || exist.address
    exist.branch = branch || exist.branch

    await exist.save()
    return res.status(200).json({ success: true, message: "Shop updated", data: exist })
  } catch (err) {
    console.error("editshop error", err)
    return res.status(500).json({ success: false, message: "Internal server error" })
  }
}
const deleteshop = async (req, res) => {
  try {
    // const isadmin = await checkonlyadmin(req);
    // if (!isadmin) return res.status(403).json({ message: "Only Admin or Super-Admin can delete items" });

    const shopid = req.params.id;
    const deleted = await Shop.findByIdAndDelete(shopid);

    if (!deleted) return res.status(404).json({ message: "Item not found" });

    return res.status(200).json({ message: "Item deleted successfully", deleted });
  } catch (error) {
    return res.status(500).json({ message: "Delete item failed", error: error.message });
  }
};
// GET /shop/all
const getAllShops = async (req, res) => {
  try {
    const data = await Shop.find().sort({ createdAt: -1 })
    return res.status(200).json({ success: true, data })
  } catch (err) {
    console.error("getAllShops error", err)
    return res.status(500).json({ success: false, message: "Internal server error" })
  }
}

// GET /shop/branches/:city  -> returns unique branches for a city
const getBranchesByCity = async (req, res) => {
  try {
    const city = req.params.city
    if (!city) return res.status(400).json({ success: false, message: "city required" })

    const shops = await Shop.find({ city: city })
    const branches = shops.map((s) => s.branch || "").filter(Boolean)

    // unique
    const uniq = Array.from(new Set(branches))
    return res.status(200).json({ success: true, city, branches: uniq })
  } catch (err) {
    console.error("getBranchesByCity error", err)
    return res.status(500).json({ success: false, message: "Internal server error" })
  }
}

module.exports = { addshop, editshop, getAllShops, getBranchesByCity ,deleteshop};
