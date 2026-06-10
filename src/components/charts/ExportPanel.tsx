import { useState, useRef } from 'react'
import { toPng } from 'html-to-image'
import { createPortal } from 'react-dom'
import { useEscKey } from '../../hooks/useEscKey'

function PreviewModal({ src, chartName, onClose, onDownload }: { src: string; chartName: string; onClose: () => void; onDownload: () => void }) {
  useEscKey(onClose)
  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-[90vw] max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E0E0E0]">
          <span className="text-sm font-semibold text-[#37474F]">Vista previa — {chartName}</span>
          <button onClick={onClose} className="text-[#90A4AE] hover:text-[#546E7A] text-lg leading-none">×</button>
        </div>
        <div className="overflow-auto p-4">
          <img src={src} alt="Preview" className="max-w-full" />
        </div>
        <div className="flex justify-end gap-2 px-4 py-2.5 border-t border-[#E0E0E0]">
          <button onClick={onClose} className="px-3 py-1 text-sm rounded border border-[#CFD8DC] hover:bg-[#ECEFF1]">Cerrar</button>
          <button onClick={onDownload} className="px-3 py-1 text-sm rounded bg-[#1A237E] text-white hover:bg-[#283593]">Descargar PNG</button>
        </div>
      </div>
    </div>
  )
}

export type AspectRatio = 'auto' | '6:1' | '4:1' | '3:1' | '16:9' | '4:3' | '1:1'
export type BgMode = 'white' | 'transparent'

const RATIOS: AspectRatio[] = ['auto', '6:1', '4:1', '3:1', '16:9', '4:3', '1:1']

interface ExportPanelProps {
  chartRef: React.RefObject<HTMLDivElement | null>
  chartName: string
  fontSize: number
  onFontSizeChange: (v: number) => void
}

function ratioToStyle(ratio: AspectRatio): React.CSSProperties {
  if (ratio === 'auto') return {}
  const [w, h] = ratio.split(':').map(Number)
  return { aspectRatio: `${w}/${h}` }
}

export function ExportPanel({ chartRef, chartName, fontSize, onFontSizeChange }: ExportPanelProps) {
  const [ratio, setRatio] = useState<AspectRatio>('auto')
  const [bg, setBg] = useState<BgMode>('white')
  const [preview, setPreview] = useState<string | null>(null)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function capture(): Promise<string | null> {
    if (!chartRef.current) return null
    return toPng(chartRef.current, {
      backgroundColor: bg === 'white' ? '#ffffff' : undefined,
      pixelRatio: 2,
    })
  }

  async function handlePreview() {
    const url = await capture()
    if (url) setPreview(url)
  }

  async function handleDownload() {
    setDownloading(true)
    try {
      const url = await capture()
      if (!url) return
      const a = document.createElement('a')
      a.href = url
      a.download = `${chartName}.png`
      a.click()
    } finally {
      setDownloading(false)
    }
  }

  async function handleCopy() {
    setCopying(true)
    try {
      const url = await capture()
      if (!url) return
      const res = await fetch(url)
      const blob = await res.blob()
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } finally {
      setCopying(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 pt-3 mt-3 border-t border-[#E0E0E0] text-xs text-[#546E7A]">
        {/* Aspect ratio */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[#37474F]">Proporción</span>
          <div className="flex gap-1">
            {RATIOS.map((r) => (
              <button
                key={r}
                onClick={() => setRatio(r)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  ratio === r
                    ? 'bg-[#1A237E] text-white border-[#1A237E]'
                    : 'border-[#CFD8DC] hover:bg-[#ECEFF1]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Background */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[#37474F]">Fondo</span>
          {(['white', 'transparent'] as BgMode[]).map((b) => (
            <button
              key={b}
              onClick={() => setBg(b)}
              className={`px-2 py-0.5 rounded border transition-colors ${
                bg === b
                  ? 'bg-[#1A237E] text-white border-[#1A237E]'
                  : 'border-[#CFD8DC] hover:bg-[#ECEFF1]'
              }`}
            >
              {b === 'white' ? 'Blanco' : 'Transparente'}
            </button>
          ))}
        </div>

        {/* Font size slider */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#37474F]">Texto</span>
          <input
            type="range"
            min={8}
            max={18}
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-24 accent-[#1A237E]"
          />
          <span>{fontSize}px</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handlePreview}
            className="px-3 py-1 rounded border border-[#CFD8DC] hover:bg-[#ECEFF1] transition-colors font-medium"
          >
            Vista previa
          </button>
          <button
            onClick={handleCopy}
            disabled={copying}
            className={`px-3 py-1 rounded border font-medium transition-all duration-300 disabled:opacity-50 ${
              copied
                ? 'border-[#2E7D32] bg-[#E8F5E9] text-[#2E7D32]'
                : 'border-[#CFD8DC] hover:bg-[#ECEFF1]'
            }`}
          >
            <span className={`inline-flex items-center gap-1 transition-all duration-200 ${copied ? 'scale-105' : ''}`}>
              {copying ? 'Copiando…' : copied ? '✓ Copiado' : 'Copiar'}
            </span>
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-3 py-1 rounded bg-[#1A237E] text-white hover:bg-[#283593] transition-colors font-medium disabled:opacity-50"
          >
            {downloading ? 'Descargando…' : 'Descargar PNG'}
          </button>
        </div>
      </div>

      {/* Export target wrapper — applies aspect ratio */}
      {ratio !== 'auto' && (
        <div
          className="hidden"
          data-export-ratio={ratio}
          style={ratioToStyle(ratio)}
        />
      )}

      {preview &&
        createPortal(
          <PreviewModal
            src={preview}
            chartName={chartName}
            onClose={() => setPreview(null)}
            onDownload={() => { handleDownload(); setPreview(null) }}
          />,
          document.body,
        )}
    </>
  )
}
