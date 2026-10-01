const r=require('express').Router();const c=require('../controllers/dashboardController');const {protect}=require('../middleware/authMiddleware');r.get('/summary',protect,c.summary);module.exports=r;
