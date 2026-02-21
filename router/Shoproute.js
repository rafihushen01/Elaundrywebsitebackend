// routes/ShopRoute.js
const express = require("express")
const upload=require("../middlewares/Multer.js")
const { addshop, editshop,getAllShops,getBranchesByCity,deleteshop } = require("../controller/Shopcontroller.js")

const router = express.Router()


router.post("/add", upload.single("image"), addshop)
router.put("/edit/:id", upload.single("image"), editshop)
router.get("/all", getAllShops)
router.get("/branches/:city", getBranchesByCity)
router.post("/delete/:id",deleteshop )
module.exports = router
