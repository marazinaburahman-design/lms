const mongoose = require('mongoose');
module.exports = mongoose.model('Teacher', new mongoose.Schema({ employeeNo:{type:String,unique:true,required:true}, name:{type:String,required:true}, email:String, phone:String, specialization:String, status:{type:String,enum:['active','inactive'],default:'active'}, user:{type:mongoose.Schema.Types.ObjectId,ref:'User'} },{timestamps:true}));
