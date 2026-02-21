const { default: mongoose } = require("mongoose")
const dotenv=require("dotenv")
dotenv.config()
const url=process.env.MONGO_URL
const connectdb=async()=>{

  try {
    const connection=await mongoose.connect(url)
    console.log(`Db connected successfully`)
    
  } catch (error) {
        console.log({message:`Db error:${error}`})
  }






}
module.exports={connectdb}