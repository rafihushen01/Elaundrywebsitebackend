const cloudinary = require('cloudinary').v2;
const dotenv=require("dotenv");
const fs=require("fs")
dotenv.config()
const uploadoncloudinary=async(file)=>{
  cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME , 
  api_key: process.env.CLOUD_API, 
  api_secret: process.env.CLOUD_SECRET
});
try {
    if(!file){return null}
     const result=await cloudinary.uploader.upload(file,{resource_type:"auto"})

    fs.unlinkSync(file)
    return result.secure_url


    
} catch (error) {
          fs.unlinkSync(file)
     console.log(error)
}








}
module.exports=uploadoncloudinary