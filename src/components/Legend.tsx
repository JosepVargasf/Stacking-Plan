import { useMemo } from 'react'
import { useStackingStore } from '../store/useStackingStore'
import { fmt } from '../lib/utils'

export default function Legend() {
  const { filteredUnits, tenantColors, hlTenant, toggleHlTenant } = useStackingStore()
  const units = filteredUnits()

  const { tenantMap, vacantM2 } = useMemo(() => {
    const tm: Record<string, number> = {}
    let vac = 0
    units.forEach((u) => {
      if (u.vacante) vac += u.util_m2
      else tm[u.arrendatario] = (tm[u.arrendatario] ?? 0) + u.util_m2
    })
    return { tenantMap: tm, vacantM2: vac }
  }, [units])

  const sorted = Object.entries(tenantMap).sort((a, b) => b[1] - a[1])

  return (
    <aside className="w-[200px] min-w-[200px] bg-white border-r border-[#CFD8DC] px-2.5 py-3.5 overflow-y-auto">
      <h3 className="text-[10px] uppercase tracking-wider text-[#90A4AE] font-bold mb-2.5 px-1">
        Arrendatarios
      </h3>

      {vacantM2 > 0 && (
        <button
          onClick={() => toggleHlTenant('Vacante')}
          className={`w-full flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-gray-50 mb-0.5 text-left transition-opacity ${
            hlTenant && hlTenant !== 'Vacante' ? 'opacity-30' : ''
          }`}
        >
          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0 border border-[#90A4AE] bg-[#CFD8DC]" />
          <span className="text-[11px] font-medium text-[#37474F] flex-1 truncate">Vacante</span>
          <span className="text-[10px] text-[#B0BEC5] flex-shrink-0">{fmt(vacantM2)}</span>
        </button>
      )}

      {sorted.map(([tenant, m2]) => {
        const col = tenantColors[tenant] ?? '#9E9E9E'
        const dimmed = hlTenant && hlTenant !== tenant
        return (
          <button
            key={tenant}
            onClick={() => toggleHlTenant(tenant)}
            className={`w-full flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-gray-50 mb-0.5 text-left transition-opacity ${
              dimmed ? 'opacity-30' : ''
            }`}
          >
            <div
              className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
              style={{ background: col }}
            />
            <span className="text-[11px] font-medium text-[#37474F] flex-1 truncate" title={tenant}>
              {tenant}
            </span>
            <span className="text-[10px] text-[#B0BEC5] flex-shrink-0">{fmt(m2)}</span>
          </button>
        )
      })}
    </aside>
  )
}
