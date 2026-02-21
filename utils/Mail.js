
const nodemailer=require("nodemailer")
const dotenv=require("dotenv")
dotenv.config()
const tranporter=nodemailer.createTransport({
      service:"gmail",
      port:465,
      secure:true,
      auth:{
        user:process.env.GMAIL,
        pass:process.env.APP_PASS
      


      }









})
const sendotp=async(to,otp)=>{
   try {
    await tranporter.sendMail({
        from:process.env.GMAIL,
        to,
        subject:`Reset Your Password with E-loundrey Shop`,

       html:`<p>Your otp for password reset is  <b>${otp}<b>.Its expires in 5minute </p>`
















    })
    
   } catch (error) {
    
    console.log(`sendotp error:${error}`)
   }
      









}
const sendsuperadminotp=async(to,otp)=>{
   try {
    await tranporter.sendMail({
        from:process.env.GMAIL,
        to,
        subject:`Verfication otp for E-loundrey Shop`,

       html:`<p>Your otp for verification is  <b>${otp}<b>.Its expires in 5minute </p>`
















    })
    
   } catch (error) {
    
    console.log(`sendotp error:${error}`)
   }
      









}
module.exports={sendotp,sendsuperadminotp}