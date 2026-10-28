import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('playwright')
const tag = process.argv[2]
const b = await chromium.launch()
for (const a of ['media','chess','social']) {
  const c = await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1})
  const p = await c.newPage(); await p.goto('http://localhost:5253/#/'+a); await p.waitForTimeout(1500)
  await p.screenshot({path:`shots/p4/${a}-${tag}.png`})
  console.log(a, await p.evaluate(()=>[document.documentElement.scrollWidth, innerWidth]))
  await c.close()
}
await b.close()
