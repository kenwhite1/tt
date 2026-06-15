const http=require('http'),fs=require('fs'),path=require('path');
const dir=__dirname;const port=process.env.PORT||8899;
http.createServer((req,res)=>{
  let p=req.url==='/'?'/index.html':req.url; p=p.split('?')[0];
  const fp=path.join(dir,p);
  fs.readFile(fp,(e,d)=>{ if(e){res.writeHead(404);res.end('nf');return;}
    const t=fp.endsWith('.css')?'text/css':'text/html';
    res.writeHead(200,{'content-type':t});res.end(d);});
}).listen(port,()=>console.log('up on',port));
