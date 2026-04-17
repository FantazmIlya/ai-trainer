
const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const db = require('../db');
const dayjs = require('dayjs');

const router = express.Router();

let gigaToken = null;

async function getToken(){
  const res = await axios.post(
    'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
    'scope=GIGACHAT_API_PERS',
    {
      headers:{
        'Content-Type':'application/x-www-form-urlencoded',
        'Authorization':'Basic '+Buffer.from(
          process.env.GIGACHAT_CLIENT_ID+':'+process.env.GIGACHAT_CLIENT_SECRET
        ).toString('base64')
      }
    }
  );
  gigaToken = res.data.access_token;
}

router.post('/ask',auth, async (req,res)=>{
  const {message} = req.body;

  try{
    if(!gigaToken) await getToken();

    const response = await axios.post(
      'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
      {
        model: "GigaChat",
        messages: [
          {role:"system", content:"Ты фитнес тренер"},
          {role:"user", content:message}
        ]
      },
      {
        headers:{
          'Authorization':'Bearer '+gigaToken,
          'Content-Type':'application/json'
        }
      }
    );

    const reply = response.data.choices[0].message.content;

    db.run(`INSERT INTO requests (user_id,date) VALUES (?,?)`,
      [req.user.id, dayjs().format('YYYY-MM-DD')]
    );

    res.json({reply});

  }catch(e){
    res.status(500).json({error:'gigachat error'});
  }
})

module.exports = router;
