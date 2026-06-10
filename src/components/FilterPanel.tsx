import { useStackingStore } from '../store/useStackingStore'
import type { UnitType } from '../types/unit'
import { flLbl } from '../lib/utils'

const ALL_TIPOS: UnitType[] = ['Oficinas', 'Locales', 'Estacionamientos', 'Bodegas']

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'arrendado', label: 'Arrendado' },
  { value: 'comun', label: 'Común' },
  { value: 'vacante', label: 'Vacante' },
  { value: 'ocupado', label: 'Ocupado (arr. + común)' },
]

const CATEGORIA_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'Arrendable', label: 'Arrendable' },
  { value: 'Común', label: 'Común' },
]

const EXPIRY_OPTIONS = [
  { value: '', label: 'Sin filtro' },
  { value: '2026-12-31', label: 'Fin 2026' },
  { value: '2027-06-30', label: 'Jun 2027' },
  { value: '2027-12-31', label: 'Fin 2027' },
  { value: '2028-12-31', label: 'Fin 2028' },
  { value: '2029-12-31', label: 'Fin 2029' },
]

// Estado color dots for visual cues
const ESTADO_COLORS: Record<string, string> = {
  arrendado: '#388E3C',
  comun: '#F57F17',
  vacante: '#C62828',
  ocupado: '#1565C0',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-wider text-[#90A4AE] mb-1.5 mt-3 first:mt-0">
      {children}
    </div>
  )
}

function Divider() {
  return <hr className="border-[#ECEFF1] my-2" />
}

export default function FilterPanel() {
  const {
    activeTipos, toggleTipo,
    filterEstado, setFilterEstado,
    filterCategoria, setFilterCategoria,
    filterTipoII, setFilterTipoII,
    filterFloors, toggleFilterFloor, clearFilterFloors,
    filterTenant, setFilterTenant,
    filterExpiry, setFilterExpiry,
    showPlaceholders, setShowPlaceholders,
    buildingFloors,
    resetFilters,
    allTenants, allTipoIIs, allFloors,
  } = useStackingStore()

  const tenants = allTenants()
  const tipoIIs = allTipoIIs()
  const floors = allFloors()

  const hasActiveFilters =
    filterEstado !== '' ||
    filterCategoria !== '' ||
    filterTipoII !== '' ||
    filterFloors.length > 0 ||
    filterTenant !== '' ||
    filterExpiry !== '' ||
    activeTipos.size < ALL_TIPOS.length

  return (
    <aside className="w-[240px] min-w-[240px] bg-white border-l border-[#CFD8DC] px-3.5 py-3 overflow-y-auto flex-shrink-0">

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-[#37474F] uppercase tracking-wide">Filtros</span>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-[10px] text-[#1A237E] hover:underline font-medium"
          >
            Limpiar todo
          </button>
        )}
      </div>

      {/* Secciones visibles */}
      <SectionTitle>Secciones</SectionTitle>
      <div className="flex flex-col gap-1">
        {ALL_TIPOS.map((tipo) => (
          <label key={tipo} className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={activeTipos.has(tipo)}
              onChange={() => toggleTipo(tipo)}
              className="accent-[#1A237E] w-3.5 h-3.5"
            />
            <span className="text-[12px] text-[#37474F]">{tipo}</span>
          </label>
        ))}
      </div>

      <Divider />

      {/* Estado */}
      <SectionTitle>Estado</SectionTitle>
      <div className="flex flex-col gap-0.5">
        {ESTADO_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer py-0.5 rounded hover:bg-[#F5F5F5] px-1">
            <input
              type="radio"
              name="filterEstado"
              value={opt.value}
              checked={filterEstado === opt.value}
              onChange={() => setFilterEstado(opt.value)}
              className="accent-[#1A237E] w-3 h-3"
            />
            {opt.value && (
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: ESTADO_COLORS[opt.value] ?? '#90A4AE' }}
              />
            )}
            <span className="text-[12px] text-[#37474F]">{opt.label}</span>
          </label>
        ))}
      </div>

      <Divider />

      {/* Categoría */}
      <SectionTitle>Categoría</SectionTitle>
      <div className="flex flex-col gap-0.5">
        {CATEGORIA_OPTIONS.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer py-0.5 rounded hover:bg-[#F5F5F5] px-1">
            <input
              type="radio"
              name="filterCategoria"
              value={opt.value}
              checked={filterCategoria === opt.value}
              onChange={() => setFilterCategoria(opt.value)}
              className="accent-[#1A237E] w-3 h-3"
            />
            <span className="text-[12px] text-[#37474F]">{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Tipo II — solo si hay opciones */}
      {tipoIIs.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Tipo II</SectionTitle>
          <select
            value={filterTipoII}
            onChange={(e) => setFilterTipoII(e.target.value)}
            className="w-full px-2 py-1.5 border border-[#CFD8DC] rounded-md text-[12px] bg-white text-[#37474F]"
          >
            <option value="">Todos</option>
            {tipoIIs.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </>
      )}

      <Divider />

      {/* Arrendatario */}
      <SectionTitle>Arrendatario</SectionTitle>
      <select
        value={filterTenant}
        onChange={(e) => setFilterTenant(e.target.value)}
        className="w-full px-2 py-1.5 border border-[#CFD8DC] rounded-md text-[12px] bg-white text-[#37474F]"
      >
        <option value="">Todos</option>
        {tenants.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      <Divider />

      {/* Piso */}
      <SectionTitle>
        <span className="flex items-center justify-between">
          <span>Piso</span>
          {filterFloors.length > 0 && (
            <button
              onClick={clearFilterFloors}
              className="normal-case tracking-normal font-normal text-[10px] text-[#1A237E] hover:underline"
            >
              Limpiar
            </button>
          )}
        </span>
      </SectionTitle>
      <div className="max-h-[160px] overflow-y-auto flex flex-col gap-0.5 pr-1">
        {floors.map((floor) => (
          <label key={floor} className="flex items-center gap-2 cursor-pointer py-0.5 rounded hover:bg-[#F5F5F5] px-1">
            <input
              type="checkbox"
              checked={filterFloors.includes(floor)}
              onChange={() => toggleFilterFloor(floor)}
              className="accent-[#1A237E] w-3 h-3"
            />
            <span className="text-[12px] text-[#37474F]">{flLbl(floor)}</span>
          </label>
        ))}
      </div>

      <Divider />

      {/* Vencimiento */}
      <SectionTitle>Vence antes de</SectionTitle>
      <select
        value={filterExpiry}
        onChange={(e) => setFilterExpiry(e.target.value)}
        className="w-full px-2 py-1.5 border border-[#CFD8DC] rounded-md text-[12px] bg-white text-[#37474F]"
      >
        {EXPIRY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Placeholder floors toggle — only when buildingFloors is configured */}
      {buildingFloors && (
        <>
          <Divider />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPlaceholders}
              onChange={(e) => setShowPlaceholders(e.target.checked)}
              className="accent-[#1A237E] w-3.5 h-3.5"
            />
            <span className="text-[12px] text-[#37474F]">Mostrar pisos sin datos</span>
          </label>
        </>
      )}

    </aside>
  )
}
