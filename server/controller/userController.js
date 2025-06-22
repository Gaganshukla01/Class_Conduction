import userModel from "../model/userModel.js";

export const userData= async(req,res)=>{

    try {

        const {userId}=req.body
        const user= await userModel.findById(userId)

        if(!user){
            return res.json({sucess:false,message:"user not found.."})
        }

        return res.json({
            sucess:true,
            message:{
                "name":user.name,
                "isAccountVerifed":user.isAccountVerified
            }
        })

        

    } catch (error) {
        return res.json({sucess:false,message:error.message})
    }
}