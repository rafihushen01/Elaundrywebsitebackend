const Order = require("../model/Order.js");
const Cart = require("../model/Cart.js");
const Shop = require("../model/Shop.js");
const User = require("../model/User.js"); // Assuming User model exists

// ---------- PLACE ORDER ----------
const placeOrder = async (req, res) => {
  try {
    const userid = req.userId || req.userData?._id;
    if (!userid) return res.status(401).json({ message: "Unauthorized" });

    const { shopid, deliveryaddress, delmobile, paymentmethod } = req.body;
    if (!shopid || !deliveryaddress || !delmobile || !paymentmethod)
      return res.status(400).json({ message: "All fields are required" });

    const shop = await Shop.findById(shopid).populate("name image mobile email branch city state address items")
    if (!shop) return res.status(404).json({ message: "Shop not found" });

    // Fetch user's cart
    const cart = await Cart.find({ userid }).populate("itemid");
    if (!cart || cart.length === 0) return res.status(400).json({ message: "Cart is empty" });

    // Prepare order items and total
    let total = 0;
    const items = cart.map(c => {
      const itemTotal = (c.services.iron?.price || 0) + (c.services.wash?.washingprice || 0);
      total += itemTotal;
      return {
        itemid: c.itemid._id,
        services: c.services,
        totalprice: itemTotal
      };
    });

    // Create Order
    const order = new Order({
      userid,
      shopid,
       shop,
      items,
      totalprice: total,
      deliveryaddress,
      delmobile,
      paymentmethod,
    });

    await order.save();
    // Optionally: clear user's cart
    await Cart.deleteMany({ userid });

    return res.status(201).json({ message: "Order placed successfully", data: order });

  } catch (err) {
    console.error("placeOrder error", err);
    return res.status(500).json({ message: "Place order failed", error: err.message });
  }
};

// ---------- GET ALL ORDERS (ADMIN/OWNER) ----------
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userid", "username email mobile gender  deliveryaddress delmobile paymentmethod ")
      .populate("shopid", "name branch address city state address image  ");

    return res.status(200).json({ success: true, data: orders });
  } catch (err) {
    console.error("getAllOrders error", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------- GET ORDERS BY USER ----------
const getUserOrders = async (req, res) => {
  try {
    const userid = req.userId || req.userData?._id;
    const orders = await Order.find({ userid })
      .populate("shopid", "name branch address city state email mobile ")
      .populate("items.itemid", "name image price washingprice");

    return res.status(200).json({ success: true, data: orders });
  } catch (err) {
    console.error("getUserOrders error", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------- UPDATE ORDER STATUS (ADMIN/OWNER) ----------
const updateOrderStatus = async (req, res) => {
  try {
    const { orderid, status } = req.body;
    if (!orderid || !status) return res.status(400).json({ message: "Order ID and status required" });
    if (!["pending", "processing","onway" ,"completed", "cancelled"].includes(status))
      return res.status(400).json({ message: "Invalid status" });

    const order = await Order.findById(orderid);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    return res.status(200).json({ message: "Order status updated", data: order });
  } catch (err) {
    console.error("updateOrderStatus error", err);
    return res.status(500).json({ message: "Update failed", error: err.message });
  }
};

module.exports = { placeOrder, getAllOrders, getUserOrders, updateOrderStatus };
