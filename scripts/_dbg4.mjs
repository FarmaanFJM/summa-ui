import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('playwright')
const [,, app, x, y] = process.argv
const b = await chromium.launch(); const c = await b.newContext({viewport:{width:390,height:2400},hasTouch:true,isMobile:true})
const p = await c.newPage(); await p.goto('http://localhost:5253/#/'+app); await p.waitForTimeout(1500)
console.log(await p.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e.outerHTML.slice(0,200)+' | '+e.parentElement.className},[+x,+y]))
await b.close()
