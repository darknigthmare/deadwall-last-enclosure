import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa_lecteur';OUT.mkdir(exist_ok=True)
async def main():
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(headless=True,executable_path=__import__('os').environ.get('CHROMIUM_PATH','/usr/bin/chromium'),args=['--no-sandbox'])
  profiles=[]
  async def profile(name,width,height,touch):
   ctx=await browser.new_context(viewport={'width':width,'height':height},device_scale_factor=2 if touch else 1,has_touch=touch,is_mobile=touch,offline=True)
   p=await ctx.new_page();errors=[];requests=[];checks=[]
   p.on('pageerror',lambda e:errors.append(str(e)))
   p.on('request',lambda r:requests.append(r.url) if r.url.startswith(('http:','https:')) else None)
   async def check(label,fn):
    try:
     await fn();checks.append({'label':label,'ok':True})
    except Exception as e:checks.append({'label':label,'ok':False,'error':str(e)})
   async def eq(expr,value):
    actual=await p.evaluate(expr)
    assert actual==value,(actual,value)
   await p.set_content((ROOT/'LECTEUR_CODEX_500.html').read_text(),wait_until='load')
   await check('500 fiches chargées sans requête externe',lambda:eq("JSON.parse(document.getElementById('data').textContent).fiches.length",500))
   await p.click('#relay-guide summary')
   await check('Guide 1.18 sans nouveau pilote fictif',lambda:eq("document.querySelector('#relay-guide').textContent.includes('42 plans') && document.querySelector('#relay-guide').open",True))
   await p.click('#relay-guide summary')
   await check('Vingt fiches et vingt-cinq familles dans le catalogue',lambda:eq("[document.querySelectorAll('#cards .card').length,document.querySelectorAll('#family option').length]",[20,26]))
   await p.select_option('#status','pilote_1_17')
   await check('Filtre des huit nouveaux plans',lambda:eq("document.querySelectorAll('#cards .card').length",8))
   await p.select_option('#status','conception_non_integree')
   await check('458 concepts signalés comme non intégrés',lambda:eq("document.getElementById('count').textContent.startsWith('458 fiche')",True))
   await p.click('#reset');await p.fill('#search','DW-0004');await p.locator('#cards button').first.click()
   await check('Fiche maison sur sous-sol et couverture 1.17',lambda:eq("document.querySelector('#detail h2').textContent.includes('sous-sol')&&document.querySelector('#detail').textContent.includes('basementHouse')",True))
   await check('Lien profond vers la fiche',lambda:eq('location.hash','#DW-0004'))
   await check('Le programme contient des espaces et du mobilier',lambda:eq("document.querySelectorAll('#detail h4').length>3&&document.querySelectorAll('#detail table').length>1",True))
   await check('Absence de débordement horizontal de la page',lambda:eq('document.documentElement.scrollWidth<=innerWidth+1',True))
   await p.screenshot(path=str(OUT/(name+'-fiche.png')),full_page=False)
   await p.locator('#detail button').first.click()
   await check('Retour au catalogue avec filtres conservés',lambda:eq("!document.body.classList.contains('detail-mode')&&document.querySelector('#search').value==='DW-0004'",True))
   await p.click('#reset');await p.click('#next')
   await check('Page suivante et vingt résultats',lambda:eq("[document.querySelector('#page').textContent,document.querySelectorAll('#cards .card').length]",['2 / 25',20]))
   await p.select_option('#status','pilote_1_17');await p.screenshot(path=str(OUT/(name+'-catalogue.png')),full_page=False)
   await check('Aucune erreur JavaScript',lambda:eq('true',not bool(errors)))
   await check('Aucune requête externe',lambda:eq('true',not bool(requests)))
   profiles.append({'name':name,'viewport':[width,height],'checks':checks,'errors':errors,'external_requests':requests})
   await ctx.close()
  await asyncio.gather(profile('bureau',1440,1000,False),profile('tactile',390,844,True))
  result={'version':'1.3.0','browser':browser.version,'profiles':profiles,'passed':sum(c['ok'] for p in profiles for c in p['checks']),'failed':sum(not c['ok'] for p in profiles for c in p['checks'])}
  (OUT/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
  print(json.dumps(result,ensure_ascii=False,indent=2))
  await browser.close()
  assert result['failed']==0
asyncio.run(main())
