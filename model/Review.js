const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  itemid: { type: mongoose.Schema.Types.ObjectId, ref: "item", required: true },
  orderid: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  
  // separate rating
  ironRating: { type: Number, min: 0, max: 5 },
  washRating: { type: Number, min: 0, max: 5 },

  ironReview: { type: String, default: "" },
  washReview: { type: String, default: "" },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Review", reviewSchema);
