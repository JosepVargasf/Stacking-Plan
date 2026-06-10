import { useRef, useState } from 'react'
import { useStackingStore } from '../store/useStackingStore'
import { parseRentRoll } from '../lib/parser'

interface HeaderProps {
  onConfigFloors?: () => void
  onExportPng?: () => void
  onExportPdf?: () => void
}

export default function Header({ onConfigFloors, onExportPng, onExportPdf }: HeaderProps) {
  const { today, buildingName, fileName, assets, activeAssetId, loadData, addAsset, removeAsset, switchAsset, clearData } = useStackingStore()
  const inputRef      = useRef<HTMLInputElement>(null)
  const addInputRef   = useRef<HTMLInputElement>(null)
  const [showExport, setShowExport] = useState(false)

  const dateStr = today.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })
  const multiAsset = assets.length > 1

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>, mode: 'replace' | 'add') {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await parseRentRoll(file)
      if (mode === 'add') addAsset(result, file.name)
      else loadData(result, file.name)
    } catch {}
    e.target.value = ''
  }

  return (
    <header className="bg-[#1A237E] text-white px-6 py-3.5 flex items-center justify-between shadow-md flex-shrink-0 gap-4">
      <div className="flex-shrink-0">
        <h1 className="text-xl font-semibold">
          {buildingName || 'Stacking Plan'}
          {buildingName && <span className="font-normal opacity-60"> — Stacking Plan</span>}
        </h1>
        <p className="text-xs opacity-70 mt-0.5">Visualización proporcional por m² útil</p>
      </div>

      {/* Multi-asset selector */}
      {multiAsset && (
        <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1 flex-wrap">
          {assets.map((asset) => (
            <div key={asset.id} className="flex items-center gap-0.5">
              <button
                onClick={() => switchAsset(asset.id)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                  asset.id === activeAssetId
                    ? 'bg-white text-[#1A237E]'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {asset.buildingName}
              </button>
              {assets.length > 1 && (
                <button
                  onClick={() => removeAsset(asset.id)}
                  title="Quitar activo"
                  className="text-white/30 hover:text-red-300 text-xs leading-none px-0.5 transition-colors"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 flex-shrink-0">
        {fileName && (
          <>
            <div className="text-xs opacity-80 text-right leading-relaxed hidden sm:block">
              <div>Al {dateStr}</div>
              <div className="opacity-60">{fileName}</div>
            </div>

            {/* Cambiar archivo (replace active) */}
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg border border-white/20 whitespace-nowrap"
            >
              Cambiar archivo
            </button>

            {/* Agregar activo */}
            <button
              onClick={() => addInputRef.current?.click()}
              title="Agregar otro activo al portfolio"
              className="text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg border border-white/20 whitespace-nowrap"
            >
              + Activo
            </button>

            {/* Configurar pisos */}
            {onConfigFloors && (
              <button
                onClick={onConfigFloors}
                className="text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg border border-white/20 whitespace-nowrap"
              >
                Configurar pisos
              </button>
            )}

            {/* Exportar dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExport((v) => !v)}
                className="text-xs font-medium bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-lg border border-white/20 whitespace-nowrap"
              >
                Exportar ▾
              </button>
              {showExport && (
                <div
                  className="absolute right-0 top-full mt-1 bg-white text-[#37474F] rounded-lg shadow-xl border border-[#E0E0E0] py-1 min-w-[150px] z-50"
                  onMouseLeave={() => setShowExport(false)}
                >
                  <button
                    onClick={() => { onExportPng?.(); setShowExport(false) }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[#F5F5F5] transition-colors"
                  >
                    Imagen PNG
                  </button>
                  <button
                    onClick={() => { onExportPdf?.(); setShowExport(false) }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-[#F5F5F5] transition-colors"
                  >
                    PDF horizontal
                  </button>
                </div>
              )}
            </div>

            {/* Desenlazar */}
            <button
              onClick={clearData}
              title="Eliminar todos los activos y volver al inicio"
              className="text-xs font-medium bg-white/5 hover:bg-red-500/30 transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-red-400/50 whitespace-nowrap opacity-70 hover:opacity-100"
            >
              Desenlazar
            </button>
          </>
        )}
      </div>

      <input ref={inputRef}    type="file" accept=".xlsx,.xls" onChange={(e) => handleChange(e, 'replace')} className="hidden" />
      <input ref={addInputRef} type="file" accept=".xlsx,.xls" onChange={(e) => handleChange(e, 'add')}     className="hidden" />
    </header>
  )
}
