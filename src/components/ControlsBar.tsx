import { useStackingStore } from '../store/useStackingStore'
import type { UnitType } from '../types/unit'

const TIPOS: UnitType[] = ['Oficinas', 'Locales', 'Estacionamientos', 'Bodegas']

const EXPIRY_OPTIONS = [
  { value: '', label: 'Sin filtro' },
  { value: '2026-12-31', label: 'Fin 2026' },
  { value: '2027-06-30', label: 'Jun 2027' },
  { value: '2027-12-31', label: 'Fin 2027' },
  { value: '2028-12-31', label: 'Fin 2028' },
  { value: '2029-12-31', label: 'Fin 2029' },
]

function Divider() {
  return <div className="w-px h-6 bg-[#CFD8DC]" />
}

export default function ControlsBar() {
  const {
    activeTipos,
    toggleTipo,
    filterTenant,
    setFilterTenant,
    filterExpiry,
    setFilterExpiry,
    allTenants,
  } = useStackingStore()

  const tenants = allTenants()

  return (
    <div className="bg-white px-6 py-2.5 flex items-center gap-4 flex-wrap border-b border-[#CFD8DC] flex-shrink-0">
      {/* Tipo toggle */}
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-[11px] text-[#607D8B] uppercase tracking-wide whitespace-nowrap">
          Tipo
        </span>
        {TIPOS.map((tipo) => {
          const active = activeTipos.has(tipo)
          return (
            <button
              key={tipo}
              onClick={() => toggleTipo(tipo)}
              className={`px-3 py-1 rounded-full border-2 text-xs font-medium transition-all ${
                active
                  ? 'border-[#1A237E] bg-[#1A237E] text-white'
                  : 'border-[#CFD8DC] bg-white text-[#546E7A] hover:border-[#7986CB] hover:bg-[#E8EAF6]'
              }`}
            >
              {tipo}
            </button>
          )
        })}
      </div>

      <Divider />

      {/* Tenant filter */}
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-[11px] text-[#607D8B] uppercase tracking-wide whitespace-nowrap">
          Arrendatario
        </span>
        <select
          value={filterTenant}
          onChange={(e) => setFilterTenant(e.target.value)}
          className="px-2 py-1 border border-[#CFD8DC] rounded-md text-xs bg-white"
        >
          <option value="">Todos</option>
          {tenants.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <Divider />

      {/* Expiry filter */}
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-[11px] text-[#607D8B] uppercase tracking-wide whitespace-nowrap">
          Vence antes de
        </span>
        <select
          value={filterExpiry}
          onChange={(e) => setFilterExpiry(e.target.value)}
          className="px-2 py-1 border border-[#CFD8DC] rounded-md text-xs bg-white"
        >
          {EXPIRY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

    </div>
  )
}
