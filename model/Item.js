const mongoose=require("mongoose");

const itemschema=new mongoose.Schema({
 name:{

    type:String,
    required:true
 },
 price:{

 type:Number,
 default:0

 },
washingprice:{

 type:Number,
 default:0
 },
image:{

    type:String,
    default:""
}








})


const item=new mongoose.model("item",itemschema)
module.exports=item