const express = require("express");
const { addtocart, getcart, updatecart, deletecart } = require("../controller/Cartcontroller.js");
const auth = require("../middlewares/IsAuth.js");
const router = express.Router();

router.post("/add",auth, addtocart);
router.get("/all", auth, getcart);
router.put("/update", auth, updatecart);
router.delete("/delete/:id", auth, deletecart);

module.exports = router;
