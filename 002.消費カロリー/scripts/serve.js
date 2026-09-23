import {createServer} from 'node:http';
import {readFileSync,statSync} from 'node:fs';
import {resolve,sep,extname} from 'node:path';
const root=resolve('dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'};
createServer((req,res)=>{try{let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root&&!path.startsWith(root+sep)){res.writeHead(403).end();return}if(statSync(path).isDirectory())path=resolve(path,'index.html');res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(readFileSync(path))}catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(readFileSync(resolve(root,'404.html')))}}).listen(4173,'127.0.0.1',()=>console.log('metdays: http://localhost:4173/ja/'));
