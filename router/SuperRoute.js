const express=require("express")
const router=express.Router()
const {superadmincreateuser} =require("../controller/Supcontroller.js")
const isAuth = require("../middlewares/IsAuth");
router.post("/accreatror",isAuth,superadmincreateuser
)
module.exports=router