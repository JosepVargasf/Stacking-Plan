import { useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Unit } from '../types/unit'
import { fmt, daysUntil } from '../lib/utils'
import { useStackingStore } from '../store/useStackingStore'

interface TooltipState {
  unit: Unit
  x: number
  y: number
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-0.5">
      <span className="text-[#78909C]">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  )
}

function Hr() {
  return <hr className="border-[#37474F] my-1.5" />
}

function Badge({ days, vacante }: { days: number | null; vacante: boolean }) {
  if (vacante)
    return <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#546E7A] text-white mt-1">VACANTE</span>
  if (days === null) return null
  if (days < 0)
    return <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C62828] text-white mt-1">VENCIDO hace {Math.abs(days)} días</span>
  if (days < 180)
    return <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C62828] text-white mt-1">VENCE en {days} días</span>
  if (days < 365)
    return <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E65100] text-white mt-1">VENCE en {days} días</span>
  if (days < 730)
    return <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F9A825] text-[#212121] mt-1">{days} días restantes</span>
  return <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#2E7D32] text-white mt-1">{Math.round(days / 365 * 10) / 10} años restantes</span>
}

function TooltipPanel({ unit, x, y }: { unit: Unit; x: number; y: number }) {
  const today = useStackingStore((s) => s.today)
  const days = daysUntil(unit.vencimiento, today)

  return (
    <div
      className="fixed z-[9999] bg-[#263238] text-white rounded-lg p-3 text-xs pointer-events-none min-w-[200px] max-w-[280px] shadow-2xl"
      style={{ left: x, top: y, transform: 'translate(14px, 14px)' }}
    >
      <div className="text-[13px] font-bold mb-1.5">Unidad {unit.unidad}</div>
      <Hr />

      {/* Partes */}
      {!unit.vacante && <Row label="Arrendatario" value={unit.arrendatario} />}
      {!unit.vacante && unit.sociedad && unit.sociedad !== unit.arrendatario && (
        <Row label="Sociedad" value={<span className="text-[10px] max-w-[160px]">{unit.sociedad}</span>} />
      )}

      {/* Identificación */}
      <Row label="Tipo" value={`${unit.tipo}${unit.tipo2 ? ` / ${unit.tipo2}` : ''}`} />
      {unit.categoria && <Row label="Categoría" value={unit.categoria} />}
      {unit.detalle && <Row label="Detalle" value={<span className="text-[10px] max-w-[160px]">{unit.detalle}</span>} />}

      {/* Superficies */}
      <Row
        label="Sup. Útil"
        value={unit.unidad_arrendable === 'un.' ? `${unit.util_m2} un.` : `${fmt(unit.util_m2, 2)} m²`}
      />
      {unit.interior_m2 !== null && (
        <Row
          label="Interior / Terraza"
          value={`${fmt(unit.interior_m2, 1)} / ${fmt(unit.terraza_m2, 1)} m²`}
        />
      )}

      {/* Financiero */}
      {!unit.vacante && (
        <>
          <Hr />
          <Row label="Canon" value={`${fmt(unit.canon, 2)} UF/mes`} />
          <Row label="UF/m²/mes" value={fmt(unit.uf_m2, 4)} />
          {unit.ggcc !== null && <Row label="GGCC" value={`${fmt(unit.ggcc, 2)} UF/mes`} />}
        </>
      )}

      {/* Fechas */}
      {!unit.vacante && (
        <>
          <Hr />
          {unit.inicio_contrato && <Row label="Inicio contrato" value={unit.inicio_contrato} />}
          {unit.primer_pago && <Row label="Primer pago" value={unit.primer_pago} />}
          <Row label="Vencimiento" value={unit.vencimiento || '—'} />
          {unit.salida_anticipada && <Row label="Salida antic." value={unit.salida_anticipada} />}
        </>
      )}

      <div className="mt-1.5">
        <Badge days={days} vacante={unit.vacante} />
      </div>
    </div>
  )
}

export function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelHide = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }

  const show = useCallback((e: React.MouseEvent, unit: Unit) => {
    cancelHide()
    setTooltip({ unit, x: e.clientX, y: e.clientY })
  }, [])

  const move = useCallback((e: React.MouseEvent) => {
    cancelHide()
    setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev))
  }, [])

  const hide = useCallback(() => {
    hideTimer.current = setTimeout(() => setTooltip(null), 80)
  }, [])

  const node = tooltip
    ? createPortal(<TooltipPanel unit={tooltip.unit} x={tooltip.x} y={tooltip.y} />, document.body)
    : null

  return { show, move, hide, node }
}
