const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  shopid: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  items: [
    {
      itemid: { type: mongoose.Schema.Types.ObjectId, ref: "item", required: true },
      services: {
        iron: { quantity: { type: Number, default: 0 }, price: { type: Number, default: 0 } },
        wash: { quantity: { type: Number, default: 0 }, price: { type: Number, default: 0 } },
      },
      totalprice: { type: Number, default: 0 },
    },
  ],
  totalprice: { type: Number, default: 0 },
  deliveryaddress: { type: String, required: true },
  delmobile: { type: String, required: true },
  paymentmethod: { type: String, enum: ["Cash", "Card", "Bank","Bikash","Nagad"], required: true },
  status: { type: String, enum: ["pending", "processing","onway" ,"completed","cancelled"], default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model("Order", OrderSchema);
