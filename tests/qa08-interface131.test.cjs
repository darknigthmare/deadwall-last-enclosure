'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {boot131}=require('./helpers/expansions131.cjs');
const {standAt}=require('./helpers/physical-fixtures.cjs');
const C=require('../src/core.js');
const groups={defense:['defense131','fortification'],exploration:['exploration131','exploration'],player:['player131','survival','companions'],world:['world131','campaign'],lore:['lore131']};
function fresh(){
 const env=boot131({ui:true}),{g,doc}=env,proto=Object.getPrototypeOf(doc.body);standAt(g,g.player,g.core());
 // Reflect native tabindex/hidden and reparenting, which the lean DOM omits.
 Object.defineProperty(proto,'tabIndex',{configurable:true,get(){return Number(this.getAttribute('tabindex')??0);},set(v){this.setAttribute('tabindex',v);}});
 const rects=proto.getClientRects,append=proto.appendChild;
 proto.getClientRects=function(){for(let n=this;n;n=n.parentNode)if(n.hidden)return[];return rects.call(this);};
 proto.appendChild=function(n){if(n.parentNode)n.remove();return append.call(this,n);};
 return env;
}
function visibleTabs(g){return g.expansionUI.section.querySelectorAll('button').filter(n=>n.getAttribute('role')==='tab');}
function tree(n){return n.textContent+' '+n.children.map(tree).join(' ');}
function actionReason(doc,button){
 const ids=(button.getAttribute('aria-describedby')||'').trim().split(/\s+/).filter(Boolean);
 assert.ok(ids.length>0,button.id+' : références descriptives requises');
 const nodes=ids.map(id=>{const node=doc.getElementById(id);assert.ok(node&&node.id===id&&doc.body.contains(node),button.id+' : cible ARIA attachée '+id);return node;});
 const reason=nodes.find(node=>node.id===button.id+'-reason');
 assert.ok(reason,button.id+' : motif du refus référencé séparément');
 assert.ok(reason.textContent.length>5,button.id);return reason;
}
function prepare(g,kind){const q=g.playerOps131.preview(kind);assert.ok(q.ok,q.reason);assert.ok(g.playerOps131.begin(kind).ok);for(let i=0;i<Math.ceil(q.seconds/.04);i++)g.playerOps131.step(.04);}
function returnScene(g){g.player.carry.wood=1;g.input.keys.add('KeyE');g.updateInteraction(.04);g.input.keys.clear();g.chronicles131UI.refresh();assert.equal(g.chronicles131.scene()?.id,'return');}

test('QA08 : cinq domaines et dix familles conservent une seule fiche, navigation clavier et pause réelle',()=>{
 const {g,doc,dispatchWindow}=fresh(),before=g.phaseTime,stocks={...g.resources};assert.equal(g.activeOverlay,null);assert.equal(g.chronicles131.scene(),null);
 assert.ok(g.expansionUI.open());const visited=[];
 for(const [group,ids]of Object.entries(groups)){
  doc.getElementById('expansionGroup-'+group).click();assert.deepEqual(visibleTabs(g).map(n=>n.id.replace('expansionTab-','')),ids);assert.equal(doc.activeElement,doc.getElementById('expansionTab-'+ids[0]));
  for(const id of ids){assert.ok(g.expansionUI.select(id,true));visited.push(id);const active=doc.getElementById('expansionTab-'+id);assert.equal(active.getAttribute('aria-selected'),'true');assert.equal(active.tabIndex,0);assert.equal(doc.getElementById('expansionDetail').getAttribute('aria-labelledby'),active.id);assert.equal(visibleTabs(g).filter(n=>n.tabIndex===0).length,1);g.loop(g.lastFrame+40);}
  const last=doc.getElementById('expansionTab-'+ids.at(-1));last.dispatch('keydown',{code:'ArrowRight'});assert.equal(doc.activeElement,doc.getElementById('expansionTab-'+ids[0]));doc.activeElement.dispatch('keydown',{code:'End'});assert.equal(doc.activeElement,last);
 }
 assert.equal(new Set(visited).size,10);assert.equal(g.phaseTime,before);assert.deepEqual(g.resources,stocks);
 const focusable=g.overlayFocusable(g.activeOverlay);focusable.at(-1).focus();dispatchWindow('keydown',{code:'Tab'});assert.equal(doc.activeElement,focusable[0]);dispatchWindow('keydown',{code:'Tab',shiftKey:true});assert.equal(doc.activeElement,focusable.at(-1));
 dispatchWindow('keydown',{code:'Escape'});assert.equal(g.activeOverlay,null);assert.equal(g.paused,false);
});

test('QA08 : rafraîchir conserve bouton, famille et défilement ; indisponibilité annonce une raison',()=>{
 const {g,doc}=fresh();g.expansionUI.open('player131');const button=doc.getElementById('expansionAction-player131-tools'),host=g.expansionUI.section.closest('.command-body');button.focus();host.scrollTop=217;
 for(let i=0;i<60;i++)g.expansionUI.refresh(true);
 assert.equal(doc.activeElement,button);assert.equal(doc.getElementById(button.id),button);assert.equal(host.scrollTop,217);assert.match(tree(button.parentNode),/60 secondes|50 %/);assert.match(tree(button.parentNode),/B 6 · F 10/);assert.match(g.expansionUI.section.querySelector('.expansion-cost-key').textContent,/F ferraille/);
 g.player.health=0;g.expansionUI.refresh(true);assert.equal(button.disabled,true);assert.equal(doc.activeElement,doc.getElementById('expansionTab-player131'));assert.match(actionReason(doc,button).textContent,/commandant debout/);
 g.player.health=100;for(const id of Object.values(groups).flat()){g.expansionUI.select(id);for(const action of g.expansionUI.section.querySelectorAll('.expansion-action'))actionReason(doc,action.querySelector('button'));}
});

test('QA08 : profils de voyage montrent le prélèvement réel et actualisent l’aperçu sans dépenser',()=>{
 const {g,doc}=fresh();g.expansionUI.open('exploration131');const before={...g.resources};
 for(const kind of ['foot','motor','rescue']){const plan=g.travel131.manifest(kind),card=doc.getElementById('expansionAction-exploration131-pack-'+kind).parentNode;assert.match(tree(card),/Dépôt → sac/);for(const [key,n]of Object.entries(plan.transfer))if(n>1e-7)assert.ok(tree(card).includes(Number(n.toFixed(2)).toLocaleString('fr-FR')+' '+C.RESOURCE_META[key].label.toLowerCase()));}
 assert.deepEqual(g.resources,before);for(const key of C.RESOURCE_KEYS)g.resources[key]=0;g.expansionUI.refresh(true);for(const kind of ['foot','motor','rescue']){const b=doc.getElementById('expansionAction-exploration131-pack-'+kind);assert.equal(b.disabled,true);assert.match(tree(b.parentNode),/Aucun prélèvement prévu/);}
});

test('QA08 : inventaire conserve la ressource focalisée, le scroll et la masse personnelle après prélèvement',()=>{
 const {g,doc}=fresh();for(const kind of ['vest','tools','ammo'])prepare(g,kind);assert.ok(g.loadoutUI.open());g.loadoutUI.body.scrollTop=180;
 for(const index of [3,0,3]){const old=doc.body.querySelector('.loadout-store').querySelectorAll('button')[index],key=C.RESOURCE_KEYS[index],before=g.player.carry[key];old.focus();old.click();const next=doc.body.querySelector('.loadout-store').querySelectorAll('button')[index];assert.equal(doc.activeElement,next);assert.equal(g.loadoutUI.body.scrollTop,180);assert.ok(g.player.carry[key]>before);assert.ok(next.getAttribute('aria-label').includes(C.RESOURCE_META[key].label.toLowerCase()));}
 const bag=g.loadout.view('sac'),eq=g.loadout.equipment(),mass=Number((bag.weight+bag.tare+eq.beltWeight+eq.personalWeight).toFixed(2)).toLocaleString('fr-FR');assert.ok(doc.body.querySelector('.loadout-total').textContent.startsWith(mass+' kg'));assert.match(tree(doc.body.querySelector('.loadout-personal')),/Gilet de fortune/);
 const item=doc.body.querySelector('.loadout-item'),id=item.dataset.item;item.focus();item.dispatch('keydown',{code:'KeyR'});assert.equal(doc.activeElement.dataset.item,id);assert.equal(g.player.reload,0);g.loadoutUI.close();assert.equal(g.paused,false);
});

test('QA08 : séquence non modale, mouvement conservé, masquage immédiat des overlays et retour du focus à expiration',()=>{
 const {g,doc,dispatchWindow}=fresh();g.canvas.focus();const camera={...g.camera};returnScene(g);const scene=g.chronicles131UI.element,skip=scene.querySelector('button');assert.equal(doc.activeElement,g.canvas);assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);assert.deepEqual(g.camera,camera);
 dispatchWindow('keydown',{code:'KeyD',target:g.canvas});assert.ok(g.input.keys.has('KeyD'));dispatchWindow('keyup',{code:'KeyD'});g.releaseInputs();g.settings.reducedMotion=true;g.chronicles131UI.refresh();assert.equal(scene.classList.contains('chronicles-static'),true);
 for(const mode of ['command','equipment','pause']){const progress=g.chronicles131.scene().progress;if(mode==='command')g.expansionUI.open();else if(mode==='equipment')g.loadoutUI.open();else g.togglePause(true);assert.equal(scene.classList.contains('hidden'),true);assert.equal(scene.inert,true);for(let i=0;i<8;i++)g.loop(g.lastFrame+40);assert.equal(g.chronicles131.scene().progress,progress);if(mode==='command')g.expansionUI.close();else if(mode==='equipment')g.loadoutUI.close();else g.togglePause(false);assert.equal(scene.classList.contains('hidden'),false);assert.equal(scene.inert,false);}
 skip.focus();for(let i=0;i<400;i++)g.chronicles131.tick(.04);g.chronicles131UI.refresh();assert.equal(g.chronicles131.scene(),null);assert.equal(scene.classList.contains('hidden'),true);assert.equal(scene.inert,true);assert.equal(doc.activeElement,g.canvas);
});

test('QA08 : premières actions proposées sans démarrage forcé, CTA absent après choix et pause préalable préservée',()=>{
 const {g,doc}=fresh();const initial=g.chronicles131.snapshot();assert.equal(g.activeOverlay,null);g.expansionUI.open('defense131');const cta=doc.getElementById('expansionFirstSteps');assert.equal(cta.parentNode.hidden,false);cta.click();assert.equal(doc.getElementById('expansionDetail').getAttribute('aria-labelledby'),'expansionTab-lore131');assert.deepEqual(g.chronicles131.snapshot(),initial);assert.equal(g.paused,true);
 doc.getElementById('expansionAction-lore131-prologue').click();assert.equal(g.chronicles131.snapshot().prologue.status,'active');assert.equal(g.paused,false);assert.equal(g.activeOverlay,null);g.expansionUI.open();assert.equal(cta.parentNode.hidden,true);
 for(const status of ['done','skipped']){const state=g.chronicles131.snapshot();state.prologue.status=status;state.prologue.stage=status==='done'?3:0;g.chronicles131.restore(state);g.expansionUI.refresh(true);assert.equal(cta.parentNode.hidden,true);}
 g.expansionUI.close();g.chronicles131.reset();g.togglePause(true);g.expansionUI.open();cta.click();assert.equal(g.chronicles131.snapshot().prologue.status,'available');g.expansionUI.close();assert.equal(g.paused,true);assert.equal(g.activeOverlay,g.ui.pauseMenu);
});
