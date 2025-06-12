const express = require('express');

const app=express();

app.get('/app',(req,res)=>{
    const hostname=process.env.HOSTNAME || req.hostname || 'localhost'
    res.send(`Hello from server! Host: ${hostname}`)
})

app.listen(3000, () => {
  console.log('Backend server running on port 3000');
});