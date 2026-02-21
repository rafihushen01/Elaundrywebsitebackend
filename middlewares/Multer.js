

const multer=require("multer")

const storage=multer.diskStorage({

    destination:(req,file,cb)=>{
        cb(null,"./public")


    },
    filename:(req,file,cb)=>{



        cb(null,file.originalname)
    }









})

const upload=multer({storage,  limits: { fileSize: 100 * 1024 * 1024 }, })
module.exports=upload