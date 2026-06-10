import { useMemo } from 'react'
import { useStackingStore } from '../store/useStackingStore'
import { computeKPIs } from '../lib/kpis'
import { fmt } from '../lib/utils'
import type { Unit } from '../types/unit'

function isArrendable(u: Unit) {
  const c = u.categoria.toLowerCase()
  return c !== 'común' && c !== 'comun'
}
function isM2(u: Unit) {
  return u.unidad_arrendable !== 'Un.' && u.unidad_arrendable !== 'un.'
}

interface AssetKpis {
  id: string
  buildingName: string
  totalM2: number
  arrendableM2: number
  occupiedM2: number
  ocupacion: number
  canon: number
  unitCount: number
}

function Pill({ value, label, color = '#1A237E' }: { value: string; label: string; color?: string }) {
  return (
    <div className="bg-[#F8F9FF] border border-[#E8EAF6] rounded-xl px-5 py-3 flex flex-col min-w-[160px] flex-1">
      <span className="text-[10px] text-[#90A4AE] uppercase tracking-wide mb-1">{label}</span>
      <span className="text-2xl font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

export default function PortfolioView() {
  const { assets, switchAsset, activeAssetId } = useStackingStore()
  const today = useStackingStore((s) => s.today)

  const assetKpis: AssetKpis[] = useMemo(() =>
    assets.map((a) => {
      const arr = a.units.filter((u) => isArrendable(u) && isM2(u))
      const occ = arr.filter((u) => !u.vacante)
      const totalM2     = a.units.reduce((s, u) => s + u.util_m2, 0)
      const arrendableM2 = arr.reduce((s, u) => s + u.util_m2, 0)
      const occupiedM2   = occ.reduce((s, u) => s + u.util_m2, 0)
      const canon = a.units.filter((u) => !u.vacante && isArrendable(u)).reduce((s, u) => s + u.canon, 0)
      return {
        id: a.id,
        buildingName: a.buildingName,
        totalM2,
        arrendableM2,
        occupiedM2,
        ocupacion: arrendableM2 > 0 ? (occupiedM2 / arrendableM2) * 100 : 0,
        canon,
        unitCount: a.units.length,
      }
    }),
  [assets])

  const totals = useMemo(() => ({
    totalM2:      assetKpis.reduce((s, a) => s + a.totalM2, 0),
    arrendableM2: assetKpis.reduce((s, a) => s + a.arrendableM2, 0),
    occupiedM2:   assetKpis.reduce((s, a) => s + a.occupiedM2, 0),
    canon:        assetKpis.reduce((s, a) => s + a.canon, 0),
    ocupacion:    0,
  }), [assetKpis])
  totals.ocupacion = totals.arrendableM2 > 0 ? (totals.occupiedM2 / totals.arrendableM2) * 100 : 0

  const allUnits = useMemo(() => assets.flatMap((a) => a.units), [assets])
  const kpis = useMemo(() => computeKPIs(allUnits, today), [allUnits, today])

  if (assets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#B0BEC5] text-[15px]">
        No hay activos cargados
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6 pb-10">
      {/* Consolidated KPIs */}
      <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#90A4AE] mb-3">
        Portfolio consolidado — {assets.length} activo{assets.length !== 1 ? 's' : ''}
      </h2>

      <div className="flex flex-wrap gap-3 mb-8">
        <Pill label="m² Totales" value={fmt(totals.totalM2)} />
        <Pill label="m² Arrendables" value={fmt(totals.arrendableM2)} />
        <Pill label="Ocupación" value={`${fmt(totals.ocupacion, 1)}%`} color="#2E7D32" />
        <Pill label="Canon Total" value={`${fmt(totals.canon, 1)} UF`} color="#1565C0" />
        <Pill label="Vence <12m" value={String(kpis.expiringCount)} color="#C62828" />
      </div>

      {/* Per-asset breakdown */}
      <h2 className="text-[13px] font-bold uppercase tracking-widest text-[#90A4AE] mb-3">
        Desglose por activo
      </h2>

      <div className="space-y-3">
        {assetKpis.map((a) => (
          <div
            key={a.id}
            className={`bg-white rounded-xl border transition-all cursor-pointer p-4 flex items-center gap-6 flex-wrap ${
              a.id === activeAssetId
                ? 'border-[#1A237E] shadow-md ring-1 ring-[#1A237E]/20'
                : 'border-[#E0E0E0] hover:border-[#9FA8DA] hover:shadow-sm'
            }`}
            onClick={() => switchAsset(a.id)}
          >
            {/* Name */}
            <div className="min-w-[200px] flex-shrink-0">
              <div className="text-[13px] font-bold text-[#1A237E]">{a.buildingName}</div>
              <div className="text-[11px] text-[#90A4AE] mt-0.5">{a.unitCount} unidades</div>
            </div>

            {/* Bar de ocupación */}
            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between text-[10px] text-[#90A4AE] mb-1">
                <span>Ocupación arrendable</span>
                <span className="font-bold text-[#37474F]">{fmt(a.ocupacion, 1)}%</span>
              </div>
              <div className="h-2 bg-[#ECEFF1] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(a.ocupacion, 100)}%`,
                    background: a.ocupacion >= 90 ? '#2E7D32' : a.ocupacion >= 70 ? '#F9A825' : '#C62828',
                  }}
                />
              </div>
              <div className="text-[10px] text-[#B0BEC5] mt-1">
                {fmt(a.occupiedM2)} / {fmt(a.arrendableM2)} m²
              </div>
            </div>

            {/* KPIs inline */}
            <div className="flex gap-5 flex-shrink-0 text-right">
              <div>
                <div className="text-[10px] text-[#90A4AE] uppercase tracking-wide">m² Totales</div>
                <div className="text-[14px] font-bold text-[#37474F]">{fmt(a.totalM2)}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#90A4AE] uppercase tracking-wide">Canon</div>
                <div className="text-[14px] font-bold text-[#1565C0]">{fmt(a.canon, 1)} UF</div>
              </div>
            </div>

            {a.id === activeAssetId && (
              <div className="ml-auto text-[10px] font-bold text-[#1A237E] bg-[#E8EAF6] px-2 py-0.5 rounded-full flex-shrink-0">
                Activo
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
