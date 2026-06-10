import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'

// ── PNG export ────────────────────────────────────────────────────────────────

export async function exportStackingPng(buildingName: string): Promise<void> {
  const el = document.getElementById('stacking-export-root')
  if (!el) return
  const url = await captureEl(el)
  download(url, `${slug(buildingName)}.png`)
}

// ── PDF export ────────────────────────────────────────────────────────────────

export async function exportFullPdf(
  kpiBarEl: HTMLElement | null,
  buildingName: string,
  dateStr: string,
): Promise<void> {
  const stackingEl = document.getElementById('stacking-export-root')
  const vencEl     = document.getElementById('venc-chart-export')
  const rankEl     = document.getElementById('rank-chart-export')

  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const PW = 297
  const PH = 210
  const M  = 10   // margin
  const HEADER_H = 14

  // Helper: draw page header bar
  function drawHeader(label?: string) {
    pdf.setFillColor(26, 35, 126)
    pdf.rect(0, 0, PW, HEADER_H, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text(buildingName || 'Stacking Plan', M, 9)
    if (label) {
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.text(label, PW / 2, 9, { align: 'center' })
    }
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.text(dateStr, PW - M, 9, { align: 'right' })
  }

  // Helper: embed an image fitting within a rect, returns bottom Y
  function embedImage(png: string, x: number, y: number, maxW: number, maxH: number): number {
    const props = pdf.getImageProperties(png)
    const scale = Math.min(maxW / props.width, maxH / props.height)
    const w = props.width  * scale
    const h = props.height * scale
    pdf.addImage(png, 'PNG', x, y, w, h)
    return y + h
  }

  // ── PAGE 1: KPI summary ───────────────────────────────────────────────────

  drawHeader('Resumen KPIs')

  let y = HEADER_H + 4

  if (kpiBarEl) {
    const kpiPng = await captureEl(kpiBarEl, '#2E3338')
    y = embedImage(kpiPng, M, y, PW - 2 * M, 30) + 4
  }

  // Subtitle
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(144, 164, 174)
  pdf.text('Continúa en las páginas siguientes: Stacking Plan completo y Gráficos de vencimientos y ranking.', M, y + 4)

  // ── PAGE 2: Full stacking plan ────────────────────────────────────────────

  if (stackingEl) {
    const stackPng = await captureFullScrollable(stackingEl)
    const props = pdf.getImageProperties(stackPng)

    // May need multiple pages if stacking is very tall
    const availW = PW - 2 * M
    const scaledH = (props.height / props.width) * availW
    const pageContentH = PH - HEADER_H - M - 4

    const pages = Math.ceil(scaledH / pageContentH)

    for (let p = 0; p < pages; p++) {
      pdf.addPage()
      drawHeader(`Stacking Plan — Piso ${p + 1}/${pages}`)

      // Crop: render only the slice for this page
      const sliceY = p * pageContentH
      const sliceH = Math.min(pageContentH, scaledH - sliceY)

      // Use clip to show only the relevant vertical slice
      const srcSliceY = (sliceY / scaledH) * props.height
      const srcSliceH = (sliceH / scaledH) * props.height

      // jsPDF doesn't support image cropping directly; use canvas approach
      const canvas = await pngToCanvas(stackPng)
      const slicedPng = canvasSlice(canvas, 0, srcSliceY, props.width, srcSliceH)

      pdf.addImage(slicedPng, 'PNG', M, HEADER_H + 4, availW, sliceH)
    }
  }

  // ── PAGE 3: Vencimientos chart ────────────────────────────────────────────

  if (vencEl) {
    pdf.addPage()
    drawHeader('Gráfico de Vencimientos por Mes')
    const png = await captureEl(vencEl)
    embedImage(png, M, HEADER_H + 4, PW - 2 * M, PH - HEADER_H - M - 4)
  }

  // ── PAGE 4: Ranking chart ─────────────────────────────────────────────────

  if (rankEl) {
    pdf.addPage()
    drawHeader('Ranking de Arrendatarios')
    const png = await captureEl(rankEl)
    embedImage(png, M, HEADER_H + 4, PW - 2 * M, PH - HEADER_H - M - 4)
  }

  pdf.save(`${slug(buildingName)}-informe.pdf`)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function captureEl(el: HTMLElement, bg = '#ffffff'): Promise<string> {
  return toPng(el, { backgroundColor: bg, pixelRatio: 2 })
}

async function captureFullScrollable(el: HTMLElement): Promise<string> {
  // Capture the full scrollable content, not just the visible area
  return toPng(el, {
    backgroundColor: '#ECEFF1',
    pixelRatio: 2,
    width:  el.scrollWidth,
    height: el.scrollHeight,
    style: {
      overflow: 'visible',
      height:   `${el.scrollHeight}px`,
      width:    `${el.scrollWidth}px`,
    },
  })
}

function slug(name: string): string {
  return (name || 'stacking-plan').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function download(url: string, filename: string): void {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
}

async function pngToCanvas(dataUrl: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.width
      canvas.height = img.height
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      resolve(canvas)
    }
    img.src = dataUrl
  })
}

function canvasSlice(
  canvas: HTMLCanvasElement,
  sx: number, sy: number,
  sw: number, sh: number,
): string {
  const out = document.createElement('canvas')
  out.width  = sw
  out.height = Math.ceil(sh)
  out.getContext('2d')!.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, Math.ceil(sh))
  return out.toDataURL('image/png')
}
