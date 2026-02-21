const mongoose = require("mongoose");

const CartSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  itemid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "item",
    required: true,
  },
  services: {
    iron: {
      quantity: { type: Number, default: 0 },
      price: { type: Number, default: 0 }, // total price for iron service
    },
    wash: {
      quantity: { type: Number, default: 0 },
      washingprice: { type: Number, default: 0 }, // total price for wash service
    },
  },
  totalprice: {
    type: Number,
    default: 0,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Cart", CartSchema);
