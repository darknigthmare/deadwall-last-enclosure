import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=fileURLToPath(new URL('..',import.meta.url));
const files=['src','scripts','desktop'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).filter(name=>/\.(?:js|cjs|mjs)$/.test(name)).map(name=>dir+'/'+name));
files.push('sw.js');
for(const file of files){const result=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});if(result.status!==0){process.stderr.write(result.stderr||result.stdout);process.exit(result.status||1);}}
console.log('Syntaxe : '+files.length+' fichiers vérifiés.');
