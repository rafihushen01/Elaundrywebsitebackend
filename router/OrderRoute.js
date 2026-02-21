const express = require("express");
const router = express.Router();
const { placeOrder, getAllOrders, getUserOrders, updateOrderStatus } = require("../controller/OrderController.js");
 const auth=require( "../middlewares/IsAuth.js"    )                    // Your auth middleware

// ---------- PLACE ORDER ----------
router.post("/place", auth, placeOrder);

// ---------- GET ORDERS ----------
router.get("/all",auth , getAllOrders); // Owner/admin only
router.get("/myorders",auth, getUserOrders); // User's own orders

// ---------- UPDATE STATUS ----------
router.put("/status",auth, updateOrderStatus); // Owner/admin only

module.exports = router;
