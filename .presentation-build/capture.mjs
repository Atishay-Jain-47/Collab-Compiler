import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
const p=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1,colorScheme:"dark"});
await p.route('**/*', async r=>{const u=new URL(r.request().url());if(u.host!=='showcase.local')return r.abort();let f=u.pathname.slice(1);if(!f.includes('.'))f='index.html';try{const b=await fs.readFile(path.join('../Compiler-frontend/dist',f));await r.fulfill({body:b,contentType:({'js':'application/javascript','html':'text/html','css':'text/css','webp':'image/webp','svg':'image/svg+xml'})[f.split('.').at(-1)]||'application/octet-stream'});}catch{await r.abort()}});
await p.goto('http://showcase.local/');
await p.locator('.cm-content').fill('def triangular(n):\n    return n * (n + 1) // 2\n\n\nlimit = int(input())\nfor n in range(1, limit + 1):\n    print(n, triangular(n))');
console.log((await p.locator('body').innerText()).slice(0,1000));
await p.screenshot({path:'editor.png'});
for (const [name,loc] of [['history',p.getByTitle('Open Version Control & History')],['ai',p.getByText('AI Assistant',{exact:false}).first()]]){await loc.click({timeout:2500}).catch(()=>{});if(name==='history'){await p.getByText('Save Version',{exact:true}).first().click();await p.waitForTimeout(5500);}else await p.waitForTimeout(500);await p.screenshot({path:name+'.png'});await p.goto('http://showcase.local/');}
await p.goto('http://showcase.local/login');await p.waitForTimeout(250);await p.screenshot({path:'login.png'});
}finally{await browser.close()}
