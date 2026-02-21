const express = require("express");
const router = express.Router();
const isauth = require("../middlewares/IsAuth.js");
const { additem, edititem, deleteitem,getallitems } = require("../controller/ItemController.js");
const upload = require("../middlewares/Multer.js");

router.post("/add", isauth,upload.single("image"), additem);
router.put("/edit/:id", isauth,upload.single("image"), edititem);
router.delete("/delete/:id", isauth, deleteitem);
// ================= ADD THIS ROUTE =================
router.get("/single/:id", isauth, async (req, res) => {
    try {
        const itemid = req.params.id;
        const single = await item.findById(itemid);

        if (!single) {
            return res.status(404).json({ message: "Item not found" });
        }

        return res.status(200).json({ message: "Single item fetched", data: single });
    } catch (error) {
        return res.status(500).json({ message: "Get single item failed", error: error.message });
    }
});
router.get("/all",isauth,  getallitems);


module.exports = router;
