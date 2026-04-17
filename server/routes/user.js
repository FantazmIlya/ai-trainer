
const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/me',auth,(req,res)=>{
  db.get(`SELECT id,email,subscription FROM users WHERE id=?`,
    [req.user.id],
    (err,user)=>res.json(user)
  )
})

module.exports = router;
