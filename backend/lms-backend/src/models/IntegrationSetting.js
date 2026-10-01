const mongoose = require('mongoose');
module.exports = mongoose.model('IntegrationSetting', new mongoose.Schema({ key:{type:String,unique:true,required:true}, value:{type:Object,default:{}}, updatedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'} },{timestamps:true}));
