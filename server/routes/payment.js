
const express = require('express');
const auth = require('../middleware/auth');
const {v4:uuidv4} = require('uuid');

const router = express.Router();

router.post('/create',auth, async (req,res)=>{
  const id = uuidv4();

  const response = await fetch('https://api.yookassa.ru/v3/payments',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'Idempotence-Key':id,
      'Authorization':'Basic '+Buffer.from(
        process.env.YOOKASSA_SHOP_ID+':'+process.env.YOOKASSA_SECRET_KEY
      ).toString('base64')
    },
    body:JSON.stringify({
      amount:{value:'299.00',currency:'RUB'},
      confirmation:{type:'redirect',return_url:'http://localhost:5173/success'},
      capture:true,
      metadata:{userId:req.user.id}
    })
  });

  const data = await response.json();
  res.json({confirmation_url:data.confirmation.confirmation_url});
})

module.exports = router;
