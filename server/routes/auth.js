
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

router.post('/register', async (req,res)=>{
  const {email,password} = req.body;
  const hash = await bcrypt.hash(password,10);

  db.run(`INSERT INTO users (email,password) VALUES (?,?)`,
    [email,hash],
    err=>{
      if(err) return res.status(400).json({error:'exists'});
      res.json({success:true});
    }
  )
})

router.post('/login',(req,res)=>{
  const {email,password} = req.body;

  db.get(`SELECT * FROM users WHERE email=?`,[email], async (err,user)=>{
    if(!user) return res.status(401).json({error:'no user'});

    const valid = await bcrypt.compare(password,user.password);
    if(!valid) return res.status(401).json({error:'wrong'});

    const token = jwt.sign({id:user.id},process.env.JWT_SECRET);
    res.json({token});
  })
})

module.exports = router;
