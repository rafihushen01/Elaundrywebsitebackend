const express = require("express");
const router = express.Router();
const auth = require("../middlewares/IsAuth.js");
const { addReview, getItemReviews } = require("../controller/ReviewController.js");

router.post("/add", auth, addReview);
router.get("/item/:id", getItemReviews);

module.exports = router;
