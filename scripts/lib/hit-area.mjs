// In-page hit-area measurement. Serialised by Playwright, so it must stay self-contained.
// For every visible interactive element it finds the EFFECTIVE hit area: the part of a 40x40 (or larger)
// square centred on the element that the browser's hit testing actually assigns to that element.
// It uses elementFromPoint, so pseudo-element extensions, overlaps and stacking are all accounted for.
export function measureHitAreas({ min = 40, step = 4, scope = 'body' }) {
  const root = document.querySelector(scope) ?? document.body
  const SEL = 'button,a[href],input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=checkbox],[role=switch],[role=menuitem],[role=option],[role=link],[role=radio],[tabindex="0"],label:has(input)'
  const vw = innerWidth, vh = innerHeight
  const label = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ((e.getAttribute('aria-label') || e.textContent || '').trim() ? ` "${(e.getAttribute('aria-label') || e.textContent).trim().slice(0, 22)}"` : '')
  const clipRect = e => {
    let r = e.getBoundingClientRect(); let l = Math.max(r.left, 0), t = Math.max(r.top, 0), rr = Math.min(r.right, vw), b = Math.min(r.bottom, vh)
    for (let p = e.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const s = getComputedStyle(p)
      if (/(auto|scroll|hidden|clip)/.test(s.overflowX + s.overflowY)) { const pr = p.getBoundingClientRect(); l = Math.max(l, pr.left); t = Math.max(t, pr.top); rr = Math.min(rr, pr.right); b = Math.min(b, pr.bottom) }
    }
    return { l, t, r: rr, b, w: rr - l, h: b - t }
  }
  const inlineLink = e => e.tagName === 'A' && e.parentElement && /^(P|LI|SPAN|SMALL|LABEL|DIV)$/.test(e.parentElement.tagName) && [...e.parentElement.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length >= 3) && getComputedStyle(e).display === 'inline'
  const out = []
  let i = 0
  for (const e of root.querySelectorAll(SEL)) {
    const s = getComputedStyle(e)
    if (s.visibility === 'hidden' || s.display === 'none' || e.disabled || e.closest('[aria-hidden=true],[inert],[data-hit-exempt]')) continue
    if (e.tagName === 'INPUT' && e.closest('label') && e.getBoundingClientRect().width < 4) continue // visually hidden input, its label is tested
    if (e.matches('input[type=checkbox],input[type=radio]') && e.getBoundingClientRect().width < 4) continue
    const c = clipRect(e)
    const full = e.getBoundingClientRect()
    if (c.w < 4 || c.h < 4 || c.w * c.h < 0.5 * full.width * full.height) continue
    if (inlineLink(e)) continue
    const cx = (c.l + c.r) / 2, cy = (c.t + c.b) / 2
    const W = Math.max(c.w, min), H = Math.max(c.h, min)
    const x0 = cx - W / 2, y0 = cy - H / 2
    // Skip elements that are not on top at their own centre (covered by an overlay).
    const top = document.elementFromPoint(cx, cy)
    if (!top || !(e === top || e.contains(top) || top.contains(e) && top.tagName === 'LABEL')) continue
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9, owned = 0, total = 0; const thieves = {}
    for (let y = y0 + step / 2; y < y0 + H; y += step) for (let x = x0 + step / 2; x < x0 + W; x += step) {
      if (x < 0 || y < 0 || x >= vw || y >= vh) continue
      total++
      const t = document.elementFromPoint(x, y)
      const mine = t && (e === t || e.contains(t) || (t.tagName === 'LABEL' && t.contains(e)))
      if (mine) { owned++; minX = Math.min(minX, x - step / 2); maxX = Math.max(maxX, x + step / 2); minY = Math.min(minY, y - step / 2); maxY = Math.max(maxY, y + step / 2) }
      else if (t) { const k = label(t.closest(SEL) ?? t); thieves[k] = (thieves[k] ?? 0) + 1 }
    }
    const effW = owned ? Math.min(maxX - minX, W) : 0, effH = owned ? Math.min(maxY - minY, H) : 0
    e.setAttribute('data-hit-i', String(i))
    out.push({ i: i++, sel: label(e), w: Math.round(c.w), h: Math.round(c.h), effW: Math.round(effW), effH: Math.round(effH), cx: Math.round(cx), cy: Math.round(cy), bbox: owned ? [Math.round(minX), Math.round(minY), Math.round(maxX), Math.round(maxY)] : null, thief: Object.entries(thieves).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null, pass: effW >= min - 2 && effH >= min - 2 })
  }
  return out
}
