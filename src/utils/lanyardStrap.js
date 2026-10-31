/**
 * Printed strap texture, ported 1:1 from the React LanyardBadge.
 * Only change: the two font stacks are passed in via `opts` instead of
 * module constants, so the page can use its own monospace.
 */

/** A mandala: rings, petals, a bead circle and a flower in the middle. */
export function drawMandala(ctx, cx, cy, r) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.lineWidth = Math.max(0.8, r * 0.018)
  for (const k of [1, 0.9, 0.62, 0.26]) {
    ctx.beginPath()
    ctx.arc(0, 0, r * k, 0, Math.PI * 2)
    ctx.stroke()
  }
  for (let i = 0; i < 16; i++) {
    ctx.save()
    ctx.rotate((i / 16) * Math.PI * 2)
    ctx.beginPath()
    ctx.ellipse(0, -r * 0.76, r * 0.07, r * 0.13, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.rotate(Math.PI / 16)
    ctx.beginPath()
    ctx.arc(0, -r * 0.95, r * 0.018, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  for (let i = 0; i < 8; i++) {
    ctx.save()
    ctx.rotate((i / 8) * Math.PI * 2)
    ctx.beginPath()
    ctx.moveTo(0, -r * 0.26)
    ctx.bezierCurveTo(r * 0.12, -r * 0.4, r * 0.1, -r * 0.52, 0, -r * 0.6)
    ctx.bezierCurveTo(-r * 0.1, -r * 0.52, -r * 0.12, -r * 0.4, 0, -r * 0.26)
    ctx.stroke()
    ctx.restore()
  }
  ctx.beginPath()
  ctx.arc(0, 0, r * 0.07, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/**
 * The printed strap, `length` css px long, laid out along the canvas height so
 * each rope segment can crop its own slice. Returns a canvas in device px.
 * opts: { color, ink, text, label, plain?, displayFont, scriptFont }
 */
export function makeStrap(length, width, dpr, opts) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(width * dpr))
  c.height = Math.max(1, Math.round(length * dpr))
  const ctx = c.getContext('2d')
  // strap space: x runs down the strap, y runs across it
  ctx.setTransform(0, dpr, -dpr, 0, c.width, 0)
  ctx.fillStyle = opts.color
  ctx.fillRect(0, 0, length, width)
  ctx.strokeStyle = ctx.fillStyle = opts.ink

  if (!opts.plain) {
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, length, width)
    ctx.clip()
    ctx.textBaseline = 'middle'
    const scriptFont = '400 ' + Math.round(width * 0.5) + 'px ' + opts.scriptFont
    const labelFont = '700 ' + Math.round(width * 0.36) + 'px ' + opts.displayFont
    ctx.font = scriptFont
    const scriptW = ctx.measureText(opts.text).width
    ctx.font = labelFont
    const labelW = ctx.measureText(opts.label).width
    const gap = width * 0.6
    let x = width * 0.4
    let flip = 1
    while (x < length) {
      // a mandala too big for the strap, so only an arc of it shows
      ctx.globalAlpha = 0.55
      drawMandala(ctx, x + width * 1.3, width * (0.5 + flip * 0.28), width * 1.35)
      x += width * 2.8
      ctx.globalAlpha = 0.95
      ctx.font = scriptFont
      ctx.fillText(opts.text, x, width * 0.52)
      x += scriptW + gap
      if (opts.label) {
        ctx.font = labelFont
        ctx.fillText('-  ' + opts.label + '  -', x, width * 0.53)
        x += labelW + ctx.measureText('-    -').width + gap
      }
      flip = -flip
    }
    ctx.restore()
  }

  // woven edges catch a little light
  ctx.globalAlpha = 0.35
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 1.5)
  ctx.lineTo(length, 1.5)
  ctx.moveTo(0, width - 1.5)
  ctx.lineTo(length, width - 1.5)
  ctx.stroke()
  return c
}
