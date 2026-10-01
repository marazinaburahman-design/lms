const IntegrationSetting=require('../models/IntegrationSetting');
exports.list=async(req,res)=>{const rows=await IntegrationSetting.find().select('-value.smtpPass -value.apiKey');res.json({success:true,settings:rows});};
exports.get=async(req,res)=>{const x=await IntegrationSetting.findOne({key:req.params.key});if(!x)return res.status(404).json({success:false,message:'Setting not found'});res.json({success:true,setting:x});};
exports.upsert=async(req,res)=>{const x=await IntegrationSetting.findOneAndUpdate({key:req.params.key},{value:req.body,updatedBy:req.user._id},{upsert:true,new:true,setDefaultsOnInsert:true});res.json({success:true,setting:x});};
exports.testEmail=async(req,res)=>{const {testEmail}=require('../services/emailService');res.json({success:true,result:await testEmail(req.body.to)});}; exports.testSms=async(req,res)=>{const {testSMS}=require('../services/smsService');res.json({success:true,result:await testSMS(req.body.to)});};
