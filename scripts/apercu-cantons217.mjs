#!/usr/bin/env node
// Serveur de la page d'aperçu des cantons (specs/monde-sans-bord, T2.5). Outil de QA hors
// jeu : il sert tools/apercu-cantons217.html et les scripts de src/ en lecture seule, sur
// 127.0.0.1. Rien ici n'est chargé par index.html ni servi par scripts/server.mjs.
// Usage : PORT=4442 node scripts/apercu-cantons217.mjs
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=fileURLToPath(new URL('..',import.meta.url)),port=Number(process.env.PORT||4442);
// core.js attend en navigateur les scripts qui le précèdent dans index.html : on reprend
// cette chaîne telle quelle, puis on ajoute les deux modules de cantons.
async function page(){
 const index=await readFile(join(root,'index.html'),'utf8'),chain=[];
 for(const m of index.matchAll(/<script src="(src\/[a-zA-Z0-9._-]+\.js)"><\/script>/g)){chain.push(m[1]);if(m[1]==='src/core.js')break;}
 if(chain[chain.length-1]!=='src/core.js')throw Error('core.js introuvable dans index.html');
 chain.push('src/world-cantons217.js','src/world-canton-gen217.js');
 const html=await readFile(join(root,'tools','apercu-cantons217.html'),'utf8'),marker=/<!-- SCRIPTS[^>]*-->/;
 if(!marker.test(html))throw Error('Repère SCRIPTS absent de la page d’aperçu');
 return html.replace(marker,chain.map(src=>'<script src="/'+src+'"></script>').join('\n'));
}
const server=createServer(async(request,response)=>{
 try{
  const path=decodeURIComponent((request.url||'/').split('?')[0]);
  if(path==='/'){response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});response.end(await page());return;}
  if(/^\/src\/[a-zA-Z0-9._-]+\.js$/.test(path)){response.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});response.end(await readFile(join(root,path.slice(1))));return;}
  response.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});response.end('Introuvable');
 }catch(error){response.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});response.end(String(error.message||error));}
});
server.listen(port,'127.0.0.1',()=>console.log('Aperçu des cantons : http://127.0.0.1:'+port+'/'));
