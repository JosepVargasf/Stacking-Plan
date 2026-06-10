import { useMemo } from 'react'
import { useStackingStore } from '../store/useStackingStore'
import { computeKPIs } from '../lib/kpis'
import { fmt } from '../lib/utils'
import type { Unit } from '../types/unit'

// ── helpers ──────────────────────────────────────────────────────────────────

function isM2(u: Unit) {
  return u.unidad_arrendable !== 'Un.' && u.unidad_arrendable !== 'un.'
}
function isArrendable(u: Unit) {
  const c = u.categoria.toLowerCase()
  return c !== 'común' && c !== 'comun'
}

function buildTipoKpis(allUnits: Unit[]) {
  const tipos = [...new Set(allUnits.map((u) => u.tipo))].sort()
  return tipos.map((tipo) => {
    const units = allUnits.filter(
      (u) => u.tipo === tipo && isArrendable(u) && !u.vacante,
    )
    if (units.length === 0) return { tipo, value: null, label: '' }

    const m2Units = units.filter(isM2)
    const unUnits = units.filter((u) => !isM2(u))

    if (m2Units.length > 0) {
      const totalM2 = m2Units.reduce((s, u) => s + u.util_m2, 0)
      const avg = totalM2 > 0
        ? m2Units.reduce((s, u) => s + u.uf_m2 * u.util_m2, 0) / totalM2
        : null
      return { tipo, value: avg, label: 'UF/m²' }
    }
    // units-based tipo
    const avg = unUnits.length > 0
      ? unUnits.reduce((s, u) => s + u.canon, 0) / unUnits.length
      : null
    return { tipo, value: avg, label: 'UF/un.' }
  })
}

// ── sub-components ────────────────────────────────────────────────────────────

function Divider() {
  return <div className="w-px self-stretch bg-white/10 mx-1" />
}

function KpiBlock({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="flex flex-col px-4 py-1.5 min-w-[110px]">
      <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-white/40 mb-0.5">
        {label}
      </span>
      <span className="text-[17px] font-bold text-white leading-none">{value}</span>
      {sub && (
        <span className="text-[10px] text-white/40 mt-0.5 leading-none">{sub}</span>
      )}
    </div>
  )
}

function TipoChip({ tipo, value, label }: { tipo: string; value: number | null; label: string }) {
  return (
    <div className="flex flex-col items-center px-3 py-1 rounded-md bg-white/5 border border-white/10 min-w-[90px]">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-white/40 leading-none mb-0.5">
        {tipo}
      </span>
      <span className="text-[13px] font-bold text-white/90 leading-none">
        {value !== null ? fmt(value, 2) : '—'}
      </span>
      <span className="text-[9px] text-white/30 leading-none mt-0.5">{label}</span>
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────

export default function KpiBar() {
  const allUnits    = useStackingStore((s) => s.allUnits)
  const today       = useStackingStore((s) => s.today)
  const buildingName = useStackingStore((s) => s.buildingName)
  const fileName    = useStackingStore((s) => s.fileName)
  const getFiltered = useStackingStore((s) => s.filteredUnits)
  const filteredUnits = useMemo(() => getFiltered(), [getFiltered, allUnits])

  // Building-wide KPIs (not filter-reactive)
  const totalM2All = useMemo(
    () => allUnits.reduce((s, u) => s + u.util_m2, 0),
    [allUnits],
  )
  const arrendableM2 = useMemo(
    () => allUnits.filter((u) => isArrendable(u) && isM2(u)).reduce((s, u) => s + u.util_m2, 0),
    [allUnits],
  )
  const occupiedArrendableM2 = useMemo(
    () => allUnits.filter((u) => isArrendable(u) && isM2(u) && !u.vacante).reduce((s, u) => s + u.util_m2, 0),
    [allUnits],
  )
  const ocupacion = arrendableM2 > 0 ? (occupiedArrendableM2 / arrendableM2) * 100 : 0

  const tipoKpis = useMemo(() => buildTipoKpis(allUnits), [allUnits])

  // Filter-reactive KPIs (existing)
  const kpis = useMemo(() => computeKPIs(filteredUnits, today), [filteredUnits, today])

  const displayName = buildingName || (fileName ? fileName.replace(/\.[^.]+$/, '') : 'Edificio')

  return (
    <div
      className="flex-shrink-0 flex items-stretch gap-0 bg-[#2E3338] border-b border-white/10 overflow-x-auto"
      style={{ minHeight: 56 }}
    >
      {/* Building name */}
      <div className="flex flex-col justify-center px-5 py-1.5 min-w-[180px] border-r border-white/10">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30 leading-none mb-1">
          Edificio
        </span>
        <span className="text-[13px] font-bold text-white leading-tight truncate max-w-[200px]" title={displayName}>
          {displayName}
        </span>
      </div>

      {/* Fixed building KPIs */}
      <KpiBlock label="m² Totales" value={fmt(totalM2All)} sub="todas las unidades" />
      <Divider />
      <KpiBlock label="m² Arrendables" value={fmt(arrendableM2)} sub="excl. áreas comunes" />
      <Divider />
      <KpiBlock
        label="Ocupación"
        value={`${fmt(ocupacion, 1)}%`}
        sub={`${fmt(occupiedArrendableM2)} / ${fmt(arrendableM2)} m²`}
      />
      <Divider />

      {/* UF por Tipo I */}
      <div className="flex items-center gap-2 px-4">
        {tipoKpis.map(({ tipo, value, label }) => (
          <TipoChip key={tipo} tipo={tipo} value={value} label={label} />
        ))}
      </div>

      {/* Filter-reactive KPIs (separated) */}
      <div className="flex items-stretch ml-auto border-l border-white/10">
        <div className="flex items-center gap-0">
          <KpiBlock
            label="Canon (filtrado)"
            value={fmt(kpis.totalCanon, 1)}
            sub="UF / mes"
          />
          <Divider />
          <KpiBlock
            label="Vence <12m"
            value={`${kpis.expiringCount}${kpis.expiredCount ? ` +${kpis.expiredCount}` : ''}`}
            sub={`${fmt(kpis.expiringM2)} m²`}
          />
        </div>
      </div>
    </div>
  )
}
