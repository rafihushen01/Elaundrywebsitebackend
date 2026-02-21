// models/Shop.js
const mongoose = require("mongoose");

const shopschema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required:false},
     mobile:{type:Number},
     email:{type:String},
     
     branch:{type:String},
    city: { type: String, required: true },
    state: { type: String, required: true },
    address: { type: String, required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: "item" }], 
    
}, { timestamps: true });

const Shop = mongoose.model("Shop", shopschema);
module.exports = Shop;
