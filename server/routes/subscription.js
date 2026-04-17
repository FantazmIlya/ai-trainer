
const express = require('express');
const auth = require('../middleware/auth');
const db = require('../db');

const router = express.Router();

router.post('/upgrade',auth,(req,res)=>{
  db.run(`UPDATE users SET subscription='pro' WHERE id=?`,
    [req.user.id],
    ()=>res.json({success:true})
  )
})

module.exports = router;
