const fs=require('fs');
const https=require('https');

const options={
    key:fs.readFileSync('./ssl/key.pen'),
    cert:fs.readFileSync('./ssl/cert.pem')
}

https.createServer(options,app).listend(443,()=>{
    console.log('Load balancer started on port 443');
})