import { useState } from 'react'
import { useStackingStore, type BuildingFloors } from '../store/useStackingStore'
import { useEscKey } from '../hooks/useEscKey'

export default function BuildingSetupDialog({ onClose }: { onClose: () => void }) {
  useEscKey(onClose)
  const { allUnits, setBuildingFloors } = useStackingStore()

  // Detect current range from data as defaults
  const pisos = allUnits.map((u) => u.piso)
  const maxFloor = pisos.length > 0 ? Math.max(...pisos.filter((p) => p > 0)) : 1
  const maxSub   = pisos.length > 0 ? Math.abs(Math.min(...pisos.filter((p) => p < 0), 0)) : 0

  const [aboveGrade, setAboveGrade] = useState(String(maxFloor))
  const [belowGrade, setBelowGrade] = useState(String(maxSub))

  const above = Math.max(1, parseInt(aboveGrade) || 1)
  const below = Math.max(0, parseInt(belowGrade) || 0)

  // Count how many placeholder floors would be added
  const dataFloors = new Set(pisos)
  const abovePlaceholders = Array.from({ length: above }, (_, i) => i + 1).filter((p) => !dataFloors.has(p)).length
  const belowPlaceholders = Array.from({ length: below }, (_, i) => -(i + 1)).filter((p) => !dataFloors.has(p)).length
  const totalPlaceholders = abovePlaceholders + belowPlaceholders

  function handleConfirm() {
    const bf: BuildingFloors = { aboveGrade: above, belowGrade: below }
    setBuildingFloors(bf)
    onClose()
  }

  function handleSkip() {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-[420px] p-6">
        <h2 className="text-[16px] font-bold text-[#1A237E] mb-1">Configurar pisos del edificio</h2>
        <p className="text-[12px] text-[#607D8B] mb-5">
          Ingresa la cantidad total de pisos para mostrar filas vacías (placeholder) donde no hay datos.
        </p>

        <div className="flex gap-4 mb-5">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-[#37474F] uppercase tracking-wide mb-1.5">
              Pisos sobre rasante
            </label>
            <input
              type="number"
              min={1}
              max={200}
              value={aboveGrade}
              onChange={(e) => setAboveGrade(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[#CFD8DC] focus:border-[#1A237E] rounded-lg text-[14px] font-bold text-center outline-none transition-colors"
            />
            <p className="text-[10px] text-[#90A4AE] mt-1 text-center">P1 – P{above}</p>
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-[#37474F] uppercase tracking-wide mb-1.5">
              Subterráneos
            </label>
            <input
              type="number"
              min={0}
              max={20}
              value={belowGrade}
              onChange={(e) => setBelowGrade(e.target.value)}
              className="w-full px-3 py-2 border-2 border-[#CFD8DC] focus:border-[#1A237E] rounded-lg text-[14px] font-bold text-center outline-none transition-colors"
            />
            <p className="text-[10px] text-[#90A4AE] mt-1 text-center">
              {below > 0 ? `S1 – S${below}` : 'Sin subterráneos'}
            </p>
          </div>
        </div>

        {totalPlaceholders > 0 && (
          <div className="bg-[#E8EAF6] rounded-lg px-3 py-2 mb-5 text-[12px] text-[#3949AB]">
            Se añadirán <strong>{totalPlaceholders}</strong> piso{totalPlaceholders !== 1 ? 's' : ''} placeholder
            {abovePlaceholders > 0 && belowPlaceholders > 0
              ? ` (${abovePlaceholders} sobre rasante, ${belowPlaceholders} subterráneos)`
              : abovePlaceholders > 0
              ? ` sobre rasante`
              : ` subterráneos`
            }.
          </div>
        )}

        {totalPlaceholders === 0 && (
          <div className="bg-[#E8F5E9] rounded-lg px-3 py-2 mb-5 text-[12px] text-[#2E7D32]">
            Todos los pisos del rango tienen datos — no se añadirán placeholders.
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-[12px] font-medium text-[#607D8B] hover:bg-[#F5F5F5] rounded-lg transition-colors"
          >
            Omitir
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-[12px] font-bold bg-[#1A237E] text-white rounded-lg hover:bg-[#283593] transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
