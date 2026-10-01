const axios = require('axios');
function enabled(){ return String(process.env.SMS_ENABLED).toLowerCase()==='true'; }
function normalizePhone(phone){ let p=String(phone||'').replace(/[^0-9+]/g,''); if(p.startsWith('+')) return p.slice(1); const cc=String(process.env.SMS_DEFAULT_COUNTRY_CODE||'94').replace(/\D/g,''); if(p.startsWith('0')) p=p.slice(1); if(!p.startsWith(cc)) p=cc+p; return p; }
async function sendSMS({to,message}) { if(!enabled()) return {sent:false,skipped:true,message:'SMS integration is disabled'}; if(!to) throw new Error('Student phone is missing'); const phone=normalizePhone(to); const url=process.env.SMS_PROVIDER_URL; if(!url) throw new Error('SMS_PROVIDER_URL is missing'); const payload={api_key:process.env.SMS_API_KEY,user_id:process.env.SMS_USER_ID,sender_id:process.env.SMS_SENDER_ID,phone,message}; const response=await axios.post(url,payload,{timeout:15000}); return {sent:true,providerResponse:response.data}; }
async function testSMS(to){ return sendSMS({to,message:'This is a test SMS from your LMS backend.'}); }
module.exports={sendSMS,testSMS,normalizePhone};
