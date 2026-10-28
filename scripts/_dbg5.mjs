import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('playwright')
const b = await chromium.launch(); const c = await b.newContext({viewport:{width:390,height:2400},hasTouch:true,isMobile:true})
const p = await c.newPage(); await p.goto('http://localhost:5253/#/social'); await p.waitForTimeout(1500)
console.log(await p.evaluate(()=>{const e=[...document.querySelectorAll('.so-name')].find(x=>x.textContent.includes('Halden'));const r=e.getBoundingClientRect();
const t=document.elementFromPoint(r.right-3,r.top+3);return JSON.stringify(r)+t.outerHTML.slice(0,200)+' || '+t.parentElement.outerHTML.slice(0,200)}))
await b.close()
