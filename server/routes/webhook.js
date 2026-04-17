
const express = require('express');
const db = require('../db');

const router = express.Router();

router.post('/yookassa',(req,res)=>{
  if(req.body.event==='payment.succeeded'){
    const userId = req.body.object.metadata.userId;

    db.run(`UPDATE users SET subscription='pro' WHERE id=?`,[userId]);
  }

  res.sendStatus(200);
})

module.exports = router;
