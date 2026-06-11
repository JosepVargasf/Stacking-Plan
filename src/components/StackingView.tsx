import { useMemo } from 'react'
import { useStackingStore } from '../store/useStackingStore'
import { flLbl, calcScale, fmt, TARGET_PX } from '../lib/utils'
import UnitBlock from './UnitBlock'
import { useTooltip } from './Tooltip'
import type { Unit } from '../types/unit'

const SUB_TARGET_PX = Math.round(TARGET_PX * 1.3)
const BOX = 40
const BOX_GAP = 2

// ── helpers ───────────────────────────────────────────────────────────────────

function isUnUnit(u: Unit) {
  return u.unidad_arrendable === 'Un.' || u.unidad_arrendable === 'un.'
}

// Zone width targeting ~6 rows, min 2 cols
function calcZoneWidth(count: number, fallback: number): number {
  if (count === 0) return fallback
  const cols = Math.max(Math.ceil(count / 6), 2)
  return cols * (BOX + BOX_GAP) - BOX_GAP
}

// ── shared event types ────────────────────────────────────────────────────────

type ShowFn = (e: React.MouseEvent, u: Unit) => void
type MoveFn = (e: React.MouseEvent) => void
type HideFn = () => void

// ── sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ text, scale }: { text: string; scale: number | null }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-[1px] text-[#90A4AE] mt-3.5 mb-1.5 ml-[52px] pb-0.5 border-b border-[#CFD8DC] flex items-center gap-2.5">
      {text}
      {scale !== null && (
        <span className="text-[10px] font-normal text-[#B0BEC5] normal-case tracking-normal">
          escala: 1 px ≈ {fmt(1 / scale, 2)} m²
        </span>
      )}
    </div>
  )
}

function FloorLabel({ piso }: { piso: number }) {
  return (
    <div className="w-11 min-w-[44px] flex-shrink-0 mr-2 text-[11px] font-bold text-[#546E7A] bg-[#ECEFF1] rounded flex items-center justify-center self-stretch">
      {flLbl(piso)}
    </div>
  )
}

function UnitBox({ unit, ghosted, show, move, hide }: { unit: Unit; ghosted: boolean; show: ShowFn; move: MoveFn; hide: HideFn }) {
  const isComun = ['común', 'comun'].includes(unit.categoria.toLowerCase())
  const bg     = unit.vacante ? '#FFEBEE' : isComun ? '#FFF8E1' : '#E8F5E9'
  const border = unit.vacante ? '#EF9A9A' : isComun ? '#FFE082' : '#A5D6A7'
  const text   = unit.vacante ? '#C62828' : isComun ? '#E65100' : '#1B5E20'
  return (
    <div
      className={`rounded-[4px] border-2 flex flex-col items-center justify-center cursor-pointer overflow-hidden flex-shrink-0 transition-all duration-150 hover:shadow-md hover:z-10 hover:-translate-y-0.5 ${ghosted ? 'opacity-[0.12]' : ''}`}
      style={{ width: BOX, height: BOX, minWidth: BOX, background: bg, borderColor: border, color: text }}
      onMouseEnter={(e) => show(e, unit)}
      onMouseMove={move}
      onMouseLeave={hide}
    >
      <div className="text-[8px] font-bold leading-none text-center truncate w-full px-0.5">{unit.unidad}</div>
      {!unit.vacante && (
        <div className="text-[7px] opacity-70 leading-none mt-[1px] truncate w-full text-center px-0.5">{unit.arrendatario}</div>
      )}
    </div>
  )
}

// One floor row: m² blocks on top + Un. grid below, all sharing the same floor label
function FloorRow({
  piso,
  m2Units,
  estacUnits,
  bodUnits,
  otherUnits,
  scale,
  m2Width: _m2Width,
  fixedEstacWidth,
  fixedBodWidth,
  show, move, hide,
}: {
  piso: number
  m2Units: Array<{ unit: Unit; ghosted: boolean }>
  estacUnits: Array<{ unit: Unit; ghosted: boolean }>
  bodUnits: Array<{ unit: Unit; ghosted: boolean }>
  otherUnits: Array<{ unit: Unit; ghosted: boolean }>
  scale: number
  m2Width: number
  fixedEstacWidth: number
  fixedBodWidth: number
  show: ShowFn; move: MoveFn; hide: HideFn
}) {
  const hasM2    = m2Units.length > 0
  const hasEstac = estacUnits.length > 0
  const hasBod   = bodUnits.length > 0
  const hasOther = otherUnits.length > 0
  const hasUn    = hasEstac || hasBod || hasOther

  const estacZoneWidth = fixedEstacWidth
  const bodZoneWidth   = fixedBodWidth

  return (
    <div className="flex items-stretch mb-[3px]">
      <FloorLabel piso={piso} />
      <div className="flex flex-col gap-[3px]">
        {/* Proportional m² row */}
        {hasM2 && (
          <div className="flex gap-[3px] items-stretch h-[52px]">
            {m2Units.map(({ unit, ghosted }) => (
              <UnitBlock
                key={unit.unidad}
                unit={unit}
                ghosted={ghosted}
                pxWidth={Math.max(unit.util_m2 * scale, 44)}
                onMouseEnter={(e) => show(e, unit)}
                onMouseMove={move}
                onMouseLeave={hide}
              />
            ))}
          </div>
        )}

        {/* Un. grid row: estac left | divider | bodegas right | other */}
        {hasUn && (
          <div className="flex items-start">
            {hasEstac && (
              <div className="flex flex-wrap items-start content-start" style={{ width: estacZoneWidth, gap: BOX_GAP }}>
                {estacUnits.map(({ unit, ghosted }) => (
                  <UnitBox key={unit.unidad} unit={unit} ghosted={ghosted} show={show} move={move} hide={hide} />
                ))}
              </div>
            )}
            {hasEstac && hasBod && (
              <div className="self-stretch bg-[#CFD8DC] flex-shrink-0 mx-[10px]" style={{ width: 1 }} />
            )}
            {hasBod && (
              <div className="flex flex-wrap items-start content-start" style={{ width: bodZoneWidth, gap: BOX_GAP }}>
                {bodUnits.map(({ unit, ghosted }) => (
                  <UnitBox key={unit.unidad} unit={unit} ghosted={ghosted} show={show} move={move} hide={hide} />
                ))}
              </div>
            )}
            {hasOther && (
              <div className="flex flex-wrap items-start content-start" style={{ gap: BOX_GAP }}>
                {otherUnits.map(({ unit, ghosted }) => (
                  <UnitBox key={unit.unidad} unit={unit} ghosted={ghosted} show={show} move={move} hide={hide} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PlaceholderRow({ piso, width }: { piso: number; width: number }) {
  return (
    <div className="flex items-stretch mb-[3px] h-[52px]">
      <FloorLabel piso={piso} />
      <div
        className="rounded-[5px] flex items-center px-4 text-[11px] text-[#BDBDBD] italic flex-shrink-0"
        style={{ width, background: '#FAFAFA', border: '1.5px dashed #E0E0E0' }}
      >
        Sin datos
      </div>
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function StackingView() {
  const { ghostedUnits, buildingFloors, showPlaceholders } = useStackingStore()
  const { show, move, hide, node: tooltipNode } = useTooltip()
  const allGhosted = ghostedUnits()

  const { byFloor, scale } = useMemo(() => {
    const byFloor: Record<number, Array<{ unit: Unit; ghosted: boolean }>> = {}
    for (const gu of allGhosted) {
      if (!byFloor[gu.unit.piso]) byFloor[gu.unit.piso] = []
      byFloor[gu.unit.piso]!.push(gu)
    }
    // Scale computed from m² units only
    const m2Units = allGhosted.filter(({ unit }) => !isUnUnit(unit))
    const m2Floors = [...new Set(m2Units.map(({ unit }) => unit.piso))].sort((a, b) => b - a)
    const m2FloorMap: Record<number, Unit[]> = {}
    for (const { unit } of m2Units) {
      if (!m2FloorMap[unit.piso]) m2FloorMap[unit.piso] = []
      m2FloorMap[unit.piso]!.push(unit)
    }
    return { byFloor, scale: calcScale(m2FloorMap, m2Floors) }
  }, [allGhosted])

  if (allGhosted.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[#B0BEC5] text-[15px]">
        Sin unidades para mostrar
      </div>
    )
  }

  // All data floors + placeholder floors, sorted desc
  const dataFloors = new Set(allGhosted.map(({ unit }) => unit.piso))
  const abovePlaceholders = (buildingFloors && showPlaceholders)
    ? Array.from({ length: buildingFloors.aboveGrade }, (_, i) => i + 1).filter((p) => !dataFloors.has(p))
    : []
  const belowPlaceholders = (buildingFloors && showPlaceholders)
    ? Array.from({ length: buildingFloors.belowGrade }, (_, i) => -(i + 1)).filter((p) => !dataFloors.has(p))
    : []

  const allFloors = [...new Set([
    ...allGhosted.map(({ unit }) => unit.piso),
    ...abovePlaceholders,
    ...belowPlaceholders,
  ])].sort((a, b) => b - a)

  const aboveFloors = allFloors.filter((p) => p > 0)
  const belowFloors = allFloors.filter((p) => p < 0)

  // Section boundary detection for labels
  const towerFloors = aboveFloors.filter((p) => p > 3)
  const commFloors  = aboveFloors.filter((p) => p >= 1 && p <= 3)

  // Compute max zone widths per section so estac/bodegas columns always align
  function maxZoneWidths(floors: number[]) {
    let maxEstac = 0
    let maxBod = 0
    let hasEstacAnywhere = false
    let hasBodAnywhere = false
    for (const p of floors) {
      const pisoUnits = byFloor[p] ?? []
      const e = pisoUnits.filter(({ unit }) => isUnUnit(unit) && unit.tipo === 'Estacionamientos').length
      const b = pisoUnits.filter(({ unit }) => isUnUnit(unit) && unit.tipo === 'Bodegas').length
      if (e > 0) { hasEstacAnywhere = true; maxEstac = Math.max(maxEstac, calcZoneWidth(e, 0)) }
      if (b > 0) { hasBodAnywhere = true; maxBod   = Math.max(maxBod,   calcZoneWidth(b, 0)) }
    }
    return { maxEstac, maxBod, hasEstacAnywhere, hasBodAnywhere }
  }

  const towerZones = maxZoneWidths(towerFloors)
  const commZones  = maxZoneWidths(commFloors)
  const belowZones = maxZoneWidths(belowFloors)

  function renderFloor(piso: number, zones: ReturnType<typeof maxZoneWidths>) {
    const isPlaceholder = !dataFloors.has(piso)
    const isSub = piso < 0
    const w = isSub ? SUB_TARGET_PX : TARGET_PX

    if (isPlaceholder) return <PlaceholderRow key={piso} piso={piso} width={w} />

    const pisoUnits = byFloor[piso] ?? []
    const m2Units    = pisoUnits.filter(({ unit }) => !isUnUnit(unit))
    const estacUnits = pisoUnits.filter(({ unit }) => isUnUnit(unit) && unit.tipo === 'Estacionamientos')
    const bodUnits   = pisoUnits.filter(({ unit }) => isUnUnit(unit) && unit.tipo === 'Bodegas')
    const otherUnits = pisoUnits.filter(({ unit }) => isUnUnit(unit) && unit.tipo !== 'Estacionamientos' && unit.tipo !== 'Bodegas')

    // Fixed widths: if only one type exists in this section, give it the full width
    const fixedEstacWidth = (!zones.hasBodAnywhere) ? w : zones.maxEstac
    const fixedBodWidth   = (!zones.hasEstacAnywhere) ? w : zones.maxBod

    return (
      <FloorRow
        key={piso}
        piso={piso}
        m2Units={m2Units}
        estacUnits={estacUnits}
        bodUnits={bodUnits}
        otherUnits={otherUnits}
        scale={scale}
        m2Width={w}
        fixedEstacWidth={fixedEstacWidth}
        fixedBodWidth={fixedBodWidth}
        show={show} move={move} hide={hide}
      />
    )
  }

  return (
    <div className="flex-1 overflow-auto p-3 pb-6 min-w-0">
      <div id="stacking-export-root" className="inline-block min-w-full bg-[#ECEFF1] p-2">

        {/* TORRE — pisos > 3 */}
        {towerFloors.length > 0 && (
          <>
            <SectionLabel text="Torre" scale={scale} />
            {towerFloors.map((p) => renderFloor(p, towerZones))}
          </>
        )}

        {/* Gap visual entre torre y locales */}
        {towerFloors.length > 0 && commFloors.length > 0 && (() => {
          const minTower = towerFloors[towerFloors.length - 1]!
          const maxComm  = commFloors[0]!
          if (minTower - maxComm > 1) {
            return (
              <div className="flex items-center my-1">
                <div className="w-11 mr-2" />
                <div
                  className="h-2 rounded opacity-60"
                  style={{
                    width: Math.round(TARGET_PX * 0.55),
                    background: 'repeating-linear-gradient(90deg,#E0E0E0 0,#E0E0E0 6px,transparent 6px,transparent 12px)',
                  }}
                />
                <span className="text-[10px] text-[#B0BEC5] ml-2">
                  Pisos {maxComm + 1}–{minTower - 1} (sin uso)
                </span>
              </div>
            )
          }
          return null
        })()}

        {/* LOCALES / PLANTA BAJA — pisos 1–3 */}
        {commFloors.length > 0 && (
          <>
            <SectionLabel text="Locales / Planta Baja" scale={scale} />
            {commFloors.map((p) => renderFloor(p, commZones))}
          </>
        )}

        {/* SUBTERRÁNEO — pisos negativos */}
        {belowFloors.length > 0 && (
          <>
            <SectionLabel text="Subterráneo" scale={scale} />
            {belowFloors.map((p) => renderFloor(p, belowZones))}
          </>
        )}

      </div>
      {tooltipNode}
    </div>
  )
}
