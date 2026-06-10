import type { Unit } from '../types/unit'
import { fmt, expClass } from '../lib/utils'
import { useStackingStore } from '../store/useStackingStore'

interface Props {
  unit: Unit
  pxWidth: number
  ghosted?: boolean
  onMouseEnter: (e: React.MouseEvent) => void
  onMouseMove: (e: React.MouseEvent) => void
  onMouseLeave: () => void
}

function isComun(u: Unit): boolean {
  const c = u.categoria.toLowerCase()
  return c === 'común' || c === 'comun'
}

// State-based color palette (issue #20)
function stateColors(unit: Unit): { bg: string; border: string; text: string } {
  if (unit.vacante)
    return { bg: '#FFEBEE', border: '#EF9A9A', text: '#C62828' }
  if (isComun(unit))
    return { bg: '#FFF8E1', border: '#FFE082', text: '#E65100' }
  return { bg: '#E8F5E9', border: '#A5D6A7', text: '#1B5E20' }
}

export default function UnitBlock({ unit, pxWidth, ghosted = false, onMouseEnter, onMouseMove, onMouseLeave }: Props) {
  const today = useStackingStore((s) => s.today)
  const ec = expClass(unit, today)
  const { bg, border, text } = stateColors(unit)

  // Expiry overrides border for occupied arrendable units
  const borderColor =
    ec === 'exp-crit' ? '#D32F2F'
    : ec === 'exp-warn' ? '#F57C00'
    : ec === 'exp-watch' ? '#FBC02D'
    : border

  const showM2 = pxWidth >= 72

  return (
    <div
      className={`rounded-[5px] px-[6px] py-[4px] cursor-pointer relative flex flex-col justify-center border-2 overflow-hidden flex-shrink-0 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:z-20 ${
        ghosted ? 'opacity-[0.12]' : ''
      }`}
      style={{
        width: pxWidth,
        minWidth: pxWidth,
        background: bg,
        color: text,
        borderColor,
      }}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* Unit number always visible — issue #36 */}
      <div className="text-[9px] font-bold leading-none opacity-75 truncate">{unit.unidad}</div>
      <div className="text-[10px] font-semibold whitespace-nowrap overflow-hidden text-ellipsis mt-[2px] leading-tight">
        {unit.vacante ? 'Vacante' : unit.arrendatario}
      </div>
      {showM2 && (
        <div className="text-[9px] opacity-60 mt-[1px]">{fmt(unit.util_m2)} m²</div>
      )}
    </div>
  )
}
