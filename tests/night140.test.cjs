'use strict';
const test=require('node:test');const {run}=require('../scripts/qa140-night.cjs');
for(const action of ['equip','store','place','pickup','refill','remove','craft','ignite'])
 test('140 : éclairage '+action+' attend la vraie recharge puis reprend et se sauvegarde',()=>run(action,'reload'));
for(const action of ['equip','store','refill','remove','craft','ignite'])
 test('140 : éclairage '+action+' libère le vrai mirador avant de manipuler',()=>run(action,'mounted'));
test('140 : ravitailler la lanterne attend la fin du travail d’armurerie',()=>run('refill','work'));
