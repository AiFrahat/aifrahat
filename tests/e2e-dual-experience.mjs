/** Real-browser integration checks. Run with PLAYWRIGHT_MODULE pointing at playwright/index.mjs. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,readdir,stat} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
const repo=resolve(process.env.E2E_ROOT||dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(process.env.E2E_OUTPUT||'../../outputs/evidence');
const modulePath=process.env.PLAYWRIGHT_MODULE;
const {chromium}=await import(modulePath?pathToFileURL(modulePath).href:'playwright');
await mkdir(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.wasm':'application/wasm','.glb':'model/gltf-binary','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.mp4':'video/mp4','.webm':'video/webm','.opus':'audio/ogg'};
const server=createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://localhost');let p=resolve(repo,'.'+decodeURIComponent(u.pathname));
  if(p!==repo&&!p.startsWith(repo+sep)){res.writeHead(403).end();return;}
  if((await stat(p)).isDirectory()){
    if(!u.pathname.endsWith('/')){res.writeHead(301,{Location:u.pathname+'/'+u.search}).end();return;}
    p=resolve(p,'index.html');
  }
  const b=await readFile(p);res.writeHead(200,{'Content-Type':mime[extname(p)]||'application/octet-stream','Content-Length':b.length});res.end(b);
}catch{res.writeHead(404).end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
const results=[],network=[],pageErrors=[],consoleErrors=[];let activeCase='initialization';
function observe(page){page.on('console',message=>{if(message.type()==='error')consoleErrors.push({case:activeCase,message:message.text()});});page.on('pageerror',e=>pageErrors.push({case:activeCase,message:e.message}));page.on('response',r=>{if(r.status()>=400)network.push({case:activeCase,url:r.url().replace(base,''),status:r.status()})});page.on('requestfailed',r=>{if(!r.failure()?.errorText.includes('ERR_ABORTED'))network.push({case:activeCase,url:r.url().replace(base,''),error:r.failure()?.errorText})});}
async function check(name,fn){activeCase=name;const start=Date.now(),beforeE=pageErrors.length,beforeN=network.length;try{const detail=await fn();assert.equal(pageErrors.length,beforeE,'JavaScript runtime error');assert.equal(network.length,beforeN,'Failed network request');results.push({name,status:'passed',durationMs:Date.now()-start,detail});console.log('PASS',name);}catch(e){results.push({name,status:'failed',durationMs:Date.now()-start,error:e.message});console.log('FAIL',name,e.message.slice(0,240));}await writeFile(resolve(out,'e2e-results.json'),JSON.stringify({browser:await browser.version(),results,pageErrors,network},null,2));}
async function clickSetting(page,selector){
  if(!await page.locator(selector+':visible').count()) await page.locator('.menu-toggle').click();
  await page.locator(selector+':visible').first().click();
  if(await page.locator('.menu-toggle').getAttribute('aria-expanded')==='true') await page.keyboard.press('Escape');
}
async function noOverflow(page){const d=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(d.scroll<=d.width+1,`Horizontal overflow ${d.scroll}/${d.width}`);}
async function visibleHit(page,selector){const result=await page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {visible:!!(r.width&&r.height),inViewport:r.left>=-1&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight,hit:el===hit||el.contains(hit),rect:{x:r.x,y:r.y,width:r.width,height:r.height}};});assert.ok(result.visible&&result.inViewport&&result.hit,`${selector} not fully reachable: ${JSON.stringify(result)}`);return result.rect;}
const widths=[{name:'desktop',width:1440,height:1000},{name:'tablet',width:768,height:1024},{name:'mobile',width:390,height:844}];
try{
  const pages=(await readdir(resolve(repo,'classic'))).filter(x=>x.endsWith('.html')).sort();assert.equal(pages.length,10);
  for(const size of widths){const context=await browser.newContext({viewport:{width:size.width,height:size.height},reducedMotion:'reduce',hasTouch:size.name==='mobile',isMobile:size.name==='mobile'});const page=await context.newPage();observe(page);
    for(const lang of ['ar','en'])for(const theme of ['light','dark'])for(const file of pages){
      await check(`classic/${file} ${size.name} ${lang} ${theme}`,async()=>{
        await page.goto(base+'/classic/'+file,{waitUntil:'load'});
        // Exercise real controls for each state instead of rewriting page state.
        if(await page.locator('html').getAttribute('lang')!==lang)await clickSetting(page,'[data-lang-toggle]');
        if(await page.locator('html').getAttribute('data-theme')!==theme)await clickSetting(page,'[data-theme-toggle]');
        await page.waitForFunction(([l,t])=>document.documentElement.lang===l&&document.documentElement.dataset.theme===t,[lang,theme]);
        assert.equal(await page.locator('html').getAttribute('dir'),lang==='ar'?'rtl':'ltr');
        assert.ok((await page.title()).trim());await noOverflow(page);
        assert.equal(await page.locator('.universe-return').getAttribute('href'),'/');
        await page.locator('.universe-return').scrollIntoViewIfNeeded();await visibleHit(page,'.universe-return');
        // Scroll all content so native lazy images are requested.
        await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight){scrollTo(0,y);await new Promise(r=>setTimeout(r,25));}scrollTo(0,0);});
        await page.evaluate(()=>document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager'));
        await page.waitForFunction(()=>[...document.images].filter(i=>i.currentSrc&&!i.closest('[hidden]')).every(i=>i.complete),null,{timeout:10000});
        const broken=await page.evaluate(()=>[...document.images].filter(i=>i.currentSrc&&!i.closest('[hidden]')&&i.complete&&i.naturalWidth===0).map(i=>i.currentSrc));assert.deepEqual(broken,[]);
        await noOverflow(page);
        if(file==='index.html'&&((lang==='ar'&&theme==='light')||(lang==='en'&&theme==='dark')))await page.screenshot({path:resolve(out,`classic-${size.name}-${lang}-${theme}.png`)});
      });
    }
    await check(`classic persistence ${size.name}`,async()=>{await page.goto(base+'/classic/project-1.html');await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');});
    await context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();observe(page);
  await check('classic directory redirect and missing route',async()=>{const r=await page.goto(base+'/classic');assert.equal(r.status(),200);assert.equal(new URL(page.url()).pathname,'/classic/');const missing=await context.request.get(base+'/classic/not-a-page.html');assert.equal(missing.status(),404);});
  await check('classic controls, keyboard, filters and FAQ',async()=>{await page.goto(base+'/classic/');const f=page.locator('[data-filter]').first();if(await f.count()){await f.click();assert.equal(await f.getAttribute('aria-pressed'),'true');}const faq=page.locator('.faq-q').first();if(await faq.count()){await faq.click();assert.equal(await faq.getAttribute('aria-expanded'),'true');await faq.click();assert.equal(await faq.getAttribute('aria-expanded'),'false');}await page.keyboard.press('Tab');await page.locator('.universe-return').focus();assert.equal(await page.evaluate(()=>document.activeElement.matches('.universe-return')),true);assert.notEqual(await page.locator('.universe-return').evaluate(el=>getComputedStyle(el).outlineStyle),'none');});
  await check('classic mobile menu and Escape',async()=>{await page.setViewportSize({width:390,height:844});await page.goto(base+'/classic/');await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');});
  // Return is activated with keyboard; the cinematic document must actually load.
  await check('classic return to Universe by keyboard',async()=>{await page.locator('.universe-return').focus();await Promise.all([page.waitForURL(base+'/'),page.keyboard.press('Enter')]);assert.equal(await page.title(),'Ai FRAHAT — Universe');assert.equal(await page.locator('#classic-nav').getAttribute('href'),'/classic/');});
  await page.setViewportSize({width:1440,height:1000});
  await check('cinematic real 3D readiness',async()=>{await page.waitForFunction(()=>document.querySelector('#enter')?.dataset.loadingStage==='ready',null,{timeout:150000});assert.equal(await page.locator('#enter').isEnabled(),true);assert.ok(await page.locator('#world canvas').count());return {stage:await page.locator('#enter').getAttribute('data-loading-stage')};});
  for(const size of [...widths,{name:'small-mobile',width:320,height:740},{name:'compact-desktop',width:1200,height:800}])await check(`cinematic new links layout ${size.name}`,async()=>{
    await page.setViewportSize({width:size.width,height:size.height});await noOverflow(page);await visibleHit(page,'#classic-nav');await page.locator('#classic-hero').scrollIntoViewIfNeeded();const hero=await visibleHit(page,'#classic-hero');
    assert.equal(await page.locator('#about').evaluate(el=>el.nextElementSibling?.id),'classic-nav');assert.equal(await page.getByRole('link',{name:'CLASSIC VERSION',exact:true}).count(),2);
    const css=await page.locator('#classic-hero').evaluate(el=>{const s=getComputedStyle(el);return{background:s.backgroundColor,border:s.borderTopColor,borderStyle:s.borderTopStyle}});assert.equal(css.background,'rgb(16, 16, 14)');assert.equal(css.border,'rgb(242, 198, 124)');assert.equal(css.borderStyle,'solid');
    if(size.width>750){const enter=await page.locator('#enter').boundingBox();assert.ok(Math.abs(enter.y+enter.height-hero.y-hero.height)<2,'Desktop hero actions should share row');}
    await page.screenshot({path:resolve(out,`universe-${size.name}-en.png`)});return hero;
  });
  await check('cinematic language and day-night controls',async()=>{await page.setViewportSize({width:1440,height:1000});await page.locator('#language').click();assert.equal(await page.locator('html').getAttribute('lang'),'ar');assert.match(await page.locator('#enter').textContent(),/ادخل/);await page.locator('#day').click();assert.match(await page.locator('#day').textContent(),/ليل|NIGHT/);await page.screenshot({path:resolve(out,'universe-desktop-ar-day.png')});await page.locator('#day').click();await page.locator('#language').click();assert.equal(await page.locator('html').getAttribute('lang'),'en');});
  await check('cinematic entry, About and Works remain functional',async()=>{await page.locator('#enter').click();await page.waitForFunction(()=>document.body.classList.contains('started'));assert.equal(await page.locator('#entry').isVisible(),false);await page.locator('#about').click();assert.equal(await page.locator('#about-page').isVisible(),true);assert.ok((await page.locator('#about-bio').textContent()).length>40);await page.locator('#about-close').click();await page.locator('#works').click();await page.waitForFunction(()=>document.body.classList.contains('works'));assert.equal(await page.locator('#project-nav').isVisible(),true);await page.locator('#next').click();await page.locator('#explore').click();assert.equal(await page.locator('#about-page').isVisible(),false);});
  await check('cinematic Navbar Classic navigation',async()=>{await Promise.all([page.waitForURL(base+'/classic/'),page.locator('#classic-nav').click()]);assert.match(await page.title(),/AiFRAHAT/);});
  await check('cinematic Hero Classic navigation before 3D readiness',async()=>{await page.goto(base+'/');await Promise.all([page.waitForURL(base+'/classic/'),page.locator('#classic-hero').click()]);assert.equal(new URL(page.url()).pathname,'/classic/');});
  await context.close();
}finally{
  const report={generatedAt:new Date().toISOString(),browser:await browser.version(),mode:'headless Chromium with actual WebGL via SwiftShader',passed:results.filter(r=>r.status==='passed').length,failed:results.filter(r=>r.status==='failed').length,results,pageErrors,consoleErrors,network,limitations:['Only Chromium installed; Firefox/WebKit/Safari not tested.','Local static HTTP server emulates directory redirects; production hosting is not changed or exercised.','External contact, social and messaging links are not submitted or clicked.']};
  await writeFile(resolve(out,'e2e-results.json'),JSON.stringify(report,null,2));console.log('SUMMARY',JSON.stringify({passed:report.passed,failed:report.failed,pageErrors:pageErrors.length,networkFailures:network.length}));
  await browser.close();await new Promise(r=>server.close(r));if(report.failed)process.exitCode=1;
}
