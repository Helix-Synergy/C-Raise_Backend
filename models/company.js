const mongoose=require("mongoose");
const companySchema=new mongoose.Schema({
    name:{type:String,required:true},
    domain:String,
},{timestamps:true})
const companyModel=mongoose.model("CompanyDetails",companySchema)
module.exports=companyModel;